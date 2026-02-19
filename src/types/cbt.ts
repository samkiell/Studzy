export type Difficulty = 'easy' | 'medium' | 'hard';
export type CbtMode = 'study' | 'exam';

export interface Question {
  id: string;
  course_id: string;
  question_id: number;
  difficulty: Difficulty;
  topic: string | null;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  explanation: string | null;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  course_id: string;
  course_title?: string; // Hydrated for UI
  course_code?: string; // Hydrated for UI
  mode: CbtMode;
  total_questions: number;
  score: number;
  duration_seconds: number;
  time_limit_seconds: number;
  started_at: string;
  question_ids?: string[];
  completed_at: string | null;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  duration_seconds: number;
  created_at: string;
}

export interface CbtSession {
  attempt: Attempt;
  questions: Question[];
}

export interface SubmitAnswer {
  question_id: string;
  selected_option: string;
  duration_seconds: number;
}

export interface SubmitAttemptRequest {
  attempt_id: string;
  answers: SubmitAnswer[];
  duration_seconds: number;
}

export interface CBTQuestion {
  course_code: string;
  question_id: number;
  difficulty: Difficulty;
  topic: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    [key: string]: string; // Allow for flexible number of options if needed
  };
  correct_option: string;
  explanation: string;
}
