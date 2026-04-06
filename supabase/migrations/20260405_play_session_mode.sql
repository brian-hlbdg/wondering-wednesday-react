-- ============================================================
-- Local Session Mode — Migration
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- 1. Question pool for local sessions (separate from global weekly questions)
CREATE TABLE IF NOT EXISTS session_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  category      text NOT NULL CHECK (category IN ('date', 'friend_group', 'deep', 'party')),
  created_at    timestamptz DEFAULT now()
);

-- 2. One row per play session / room
CREATE TABLE IF NOT EXISTS play_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code             text UNIQUE NOT NULL,
  host_user_id          uuid NOT NULL REFERENCES users_profile(id),
  categories            text[] NOT NULL,
  allow_guests          boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'lobby'
                          CHECK (status IN ('lobby', 'active', 'ended')),
  current_question_id   uuid REFERENCES session_questions(id),
  current_asker_index   int NOT NULL DEFAULT 0,
  question_unlocked_at  timestamptz,
  question_index        int NOT NULL DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  ended_at              timestamptz
);

-- 3. Everyone in the room
CREATE TABLE IF NOT EXISTS play_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users_profile(id),
  display_name  text NOT NULL,
  is_host       boolean NOT NULL DEFAULT false,
  join_order    int NOT NULL,
  joined_at     timestamptz DEFAULT now(),
  left_at       timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS play_participants_session_user
  ON play_participants(session_id, user_id)
  WHERE user_id IS NOT NULL;

-- 4. History of every question shown in a session
CREATE TABLE IF NOT EXISTS play_session_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            uuid NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  question_id           uuid NOT NULL REFERENCES session_questions(id),
  asker_participant_id  uuid NOT NULL REFERENCES play_participants(id),
  shown_at              timestamptz DEFAULT now(),
  skipped               boolean NOT NULL DEFAULT false,
  skip_reason           text,
  skip_requested_by     uuid REFERENCES play_participants(id)
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_session_log ENABLE ROW LEVEL SECURITY;

-- session_questions: public read (questions are not sensitive)
CREATE POLICY "session_questions_select" ON session_questions
  FOR SELECT USING (true);

-- play_sessions: anyone authenticated can read by room_code; host can update; anyone can insert (to create)
CREATE POLICY "play_sessions_select" ON play_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "play_sessions_insert" ON play_sessions
  FOR INSERT WITH CHECK (auth.uid()::uuid = host_user_id);

CREATE POLICY "play_sessions_update" ON play_sessions
  FOR UPDATE USING (auth.uid()::uuid = host_user_id);

-- play_participants: members of the session can read all participants; anyone authenticated can join
CREATE POLICY "play_participants_select" ON play_participants
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM play_participants pp
      WHERE pp.session_id = play_participants.session_id
        AND pp.user_id = auth.uid()::uuid
        AND pp.left_at IS NULL
    )
  );

CREATE POLICY "play_participants_insert" ON play_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "play_participants_update" ON play_participants
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- play_session_log: session members can read; system (RPC) handles inserts
CREATE POLICY "play_session_log_select" ON play_session_log
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM play_participants pp
      WHERE pp.session_id = play_session_log.session_id
        AND pp.user_id = auth.uid()::uuid
        AND pp.left_at IS NULL
    )
  );

-- ============================================================
-- RPC: advance_session_question
-- Atomically logs the current question and advances to the next
-- ============================================================

CREATE OR REPLACE FUNCTION advance_session_question(
  p_session_id  uuid,
  p_skip        boolean DEFAULT false,
  p_skip_reason text    DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session         play_sessions%ROWTYPE;
  v_asker_id        uuid;
  v_next_question   uuid;
  v_next_asker_idx  int;
  v_participant_count int;
BEGIN
  -- Lock the session row
  SELECT * INTO v_session
  FROM play_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Verify caller is the current asker or the host
  SELECT id INTO v_asker_id
  FROM play_participants
  WHERE session_id = p_session_id
    AND user_id = auth.uid()::uuid
    AND left_at IS NULL
  LIMIT 1;

  IF v_asker_id IS NULL THEN
    RAISE EXCEPTION 'Not a participant in this session';
  END IF;

  -- Log the question that just finished
  IF v_session.current_question_id IS NOT NULL THEN
    INSERT INTO play_session_log (
      session_id, question_id, asker_participant_id,
      skipped, skip_reason
    ) VALUES (
      p_session_id, v_session.current_question_id, v_asker_id,
      p_skip, p_skip_reason
    );
  END IF;

  -- Count active participants for turn rotation
  SELECT COUNT(*) INTO v_participant_count
  FROM play_participants
  WHERE session_id = p_session_id AND left_at IS NULL;

  v_next_asker_idx := (v_session.current_asker_index + 1) % GREATEST(v_participant_count, 1);

  -- Pick next question: random from matching categories, prefer unseen ones
  SELECT sq.id INTO v_next_question
  FROM session_questions sq
  WHERE sq.category = ANY(v_session.categories)
    AND sq.id != COALESCE(v_session.current_question_id, gen_random_uuid())
    AND sq.id NOT IN (
      SELECT question_id FROM play_session_log
      WHERE session_id = p_session_id
    )
  ORDER BY random()
  LIMIT 1;

  -- Fallback: allow repeats if pool is exhausted
  IF v_next_question IS NULL THEN
    SELECT sq.id INTO v_next_question
    FROM session_questions sq
    WHERE sq.category = ANY(v_session.categories)
      AND sq.id != COALESCE(v_session.current_question_id, gen_random_uuid())
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Update session state
  UPDATE play_sessions SET
    current_question_id  = v_next_question,
    question_unlocked_at = now(),
    current_asker_index  = v_next_asker_idx,
    question_index       = question_index + 1
  WHERE id = p_session_id;
END;
$$;

-- ============================================================
-- RPC: start_play_session
-- Sets first question and transitions lobby → active
-- ============================================================

CREATE OR REPLACE FUNCTION start_play_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session       play_sessions%ROWTYPE;
  v_first_question uuid;
BEGIN
  SELECT * INTO v_session FROM play_sessions WHERE id = p_session_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.host_user_id != auth.uid()::uuid THEN
    RAISE EXCEPTION 'Only the host can start the session';
  END IF;

  IF v_session.status != 'lobby' THEN
    RAISE EXCEPTION 'Session is not in lobby state';
  END IF;

  SELECT id INTO v_first_question
  FROM session_questions
  WHERE category = ANY(v_session.categories)
  ORDER BY random()
  LIMIT 1;

  UPDATE play_sessions SET
    status               = 'active',
    current_question_id  = v_first_question,
    question_unlocked_at = now(),
    current_asker_index  = 0,
    question_index       = 1
  WHERE id = p_session_id;
END;
$$;

-- ============================================================
-- Enable Realtime on tables that need live updates
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE play_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE play_participants;

-- ============================================================
-- Seed: session_questions
-- ============================================================

INSERT INTO session_questions (question_text, category) VALUES
  -- DATE (2-person romantic / getting to know you)
  ('What moment in your life would you relive if you could?', 'date'),
  ('What does a perfect Sunday look like to you?', 'date'),
  ('What''s something you''ve never told anyone about yourself?', 'date'),
  ('If you could live anywhere in the world, where would it be and why?', 'date'),
  ('What''s the most spontaneous thing you''ve ever done?', 'date'),
  ('What does home mean to you?', 'date'),
  ('What''s something you''re really proud of that most people don''t know about?', 'date'),
  ('What''s your love language and when did you figure it out?', 'date'),
  ('What''s the best piece of advice you''ve ever been given?', 'date'),
  ('What''s a fear you''ve overcome, and how?', 'date'),
  ('What''s something you''ve always wanted to learn but haven''t started yet?', 'date'),
  ('What''s the most memorable meal you''ve ever had?', 'date'),
  ('What does adventure mean to you?', 'date'),
  ('What''s one thing you wish people understood about you?', 'date'),
  ('What''s a tradition from your family that you want to carry forward?', 'date'),

  -- FRIEND GROUP (casual, fun, bonding)
  ('What''s the worst job you''ve ever had?', 'friend_group'),
  ('What''s a skill you have that most people don''t know about?', 'friend_group'),
  ('What''s the most embarrassing thing that''s happened to you publicly?', 'friend_group'),
  ('If you had to eat one meal every day for a year, what would it be?', 'friend_group'),
  ('What''s a movie or show you pretend you''ve seen but haven''t?', 'friend_group'),
  ('What''s the strangest thing you believed as a kid?', 'friend_group'),
  ('If you had to describe yourself using only three words, what would they be?', 'friend_group'),
  ('What''s a bad habit you''re low-key proud of?', 'friend_group'),
  ('What''s the most ridiculous argument you''ve ever had with someone?', 'friend_group'),
  ('What''s the craziest thing you''ve done to impress someone?', 'friend_group'),
  ('If your life had a theme song, what would it be?', 'friend_group'),
  ('What''s something you do when no one is watching?', 'friend_group'),
  ('What''s the weirdest thing you find attractive in a person?', 'friend_group'),
  ('If you could switch lives with anyone in this group for a week, who and why?', 'friend_group'),
  ('What''s a conspiracy theory you low-key believe?', 'friend_group'),

  -- DEEP / SERIOUS
  ('What belief have you changed your mind on in the last five years?', 'deep'),
  ('What does success mean to you right now?', 'deep'),
  ('What''s a chapter of your life you''re still trying to make sense of?', 'deep'),
  ('When do you feel most like yourself?', 'deep'),
  ('What''s something you regret not saying to someone?', 'deep'),
  ('What scares you most about the future?', 'deep'),
  ('What''s one thing you want to be remembered for?', 'deep'),
  ('Who in your life has had the biggest influence on who you are today?', 'deep'),
  ('What does it mean to you to live a good life?', 'deep'),
  ('What''s something you used to judge others for that you now understand?', 'deep'),
  ('At what point in your life did you feel like you finally knew yourself?', 'deep'),
  ('What''s a sacrifice you''ve made that you don''t regret?', 'deep'),
  ('What''s a truth you know but find hard to live by?', 'deep'),
  ('What part of your personality did you have to fight hardest to keep?', 'deep'),
  ('If you could write a letter to your 15-year-old self, what''s the first thing you''d say?', 'deep'),

  -- PARTY / ICEBREAKER
  ('Would you rather have the ability to fly or be invisible? Why?', 'party'),
  ('What''s your most controversial food opinion?', 'party'),
  ('If you could have any celebrity as your best friend, who would it be?', 'party'),
  ('What''s the most useless talent you have?', 'party'),
  ('If you were a kitchen appliance, which one would you be and why?', 'party'),
  ('What''s the worst haircut you''ve ever had?', 'party'),
  ('If you had to compete on a reality TV show, which one would you choose?', 'party'),
  ('What''s a word you always misspell no matter how many times you look it up?', 'party'),
  ('If animals could talk, which one do you think would be the rudest?', 'party'),
  ('What''s the weirdest dream you remember having?', 'party'),
  ('If you could only listen to one album for the rest of your life, what would it be?', 'party'),
  ('What''s the most unexpected thing you''ve Googled recently?', 'party'),
  ('If you had to live in a decade other than this one, which would you pick?', 'party'),
  ('What''s something you own way too many of?', 'party'),
  ('What would the title of your autobiography be?', 'party');
