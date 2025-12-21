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