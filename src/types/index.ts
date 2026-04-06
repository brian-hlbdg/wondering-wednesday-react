export interface UserProfile {
  id: string;
  username: string;
  email: string;  
  phone_last_4: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  active_from: string | null;
  active_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  answer_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
}

export interface Vote {
  id: string;
  answer_id: string;
  user_id: string;
  created_at: string;
}

// Extended types with relations
export interface AnswerWithStats extends Answer {
  user?: UserProfile;
  question?: Question;
  votes?: { count: number }[];
  discussions?: { count: number }[];
  vote_count: number;
  discussion_count: number;
  has_user_voted?: boolean;
}

export interface DiscussionWithUser extends Discussion {
  user?: UserProfile;
}

// ── Local Session Mode ────────────────────────────────────────

export type SessionCategory = 'date' | 'friend_group' | 'deep' | 'party'

export interface SessionQuestion {
  id: string
  question_text: string
  category: SessionCategory
  created_at: string
}

export interface PlaySession {
  id: string
  room_code: string
  host_user_id: string
  categories: string[]
  allow_guests: boolean
  status: 'lobby' | 'active' | 'ended'
  current_question_id: string | null
  current_asker_index: number
  question_unlocked_at: string | null
  question_index: number
  created_at: string
  ended_at: string | null
}

export interface PlayParticipant {
  id: string
  session_id: string
  user_id: string | null
  display_name: string
  is_host: boolean
  join_order: number
  joined_at: string
  left_at: string | null
}

export interface PlaySessionLog {
  id: string
  session_id: string
  question_id: string
  asker_participant_id: string
  shown_at: string
  skipped: boolean
  skip_reason: string | null
  skip_requested_by: string | null
}

// Derived state used by the session screen
export type SessionDerivedState =
  | { phase: 'lobby' }
  | {
      phase: 'question_locked'
      secondsRemaining: number
      currentQuestion: SessionQuestion
      currentAsker: PlayParticipant
      nextAsker: PlayParticipant | null
    }
  | {
      phase: 'question_unlocked'
      currentQuestion: SessionQuestion
      currentAsker: PlayParticipant
      nextAsker: PlayParticipant | null
    }
  | { phase: 'ended' }