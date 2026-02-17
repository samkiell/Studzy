export type Difficulty = 'easy' | 'medium' | 'hard';
export type CbtMode = 'study' | 'exam';

export interface Question {
  id: string;
  course_code: string;
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
  course_code: string;
  mode: CbtMode;
  total_questions: number;
  score: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  created_at: string;
}

export interface CbtSession {
  attempt: Attempt;
  questions: Question[];
}

export interface SubmitAnswer {
  question_id: string;
  selected_option: string;
}

export interface SubmitAttemptRequest {
  attempt_id: string;
  answers: SubmitAnswer[];
  duration_seconds: number;
}
