export type Difficulty = 'easy' | 'medium' | 'hard';
export type CbtMode = 'study' | 'exam';
export type QuestionType = 'mcq' | 'theory';

export interface Question {
  id: string;
  course_id: string;
  question_id: number;
  difficulty: Difficulty;
  topic: string | null;
  question_text: string;
  options: Record<string, string>;
  correct_option: string | null;
  explanation: string | null;
  created_at: string;
  // Theory question fields (optional, only present for theory questions)
  question_type?: QuestionType;
  model_answer?: string | null;
  key_points?: string[] | null;
  rubric?: string | null;
  sub_questions?: { label: string; content: string }[] | null;
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
  question_type: QuestionType;
  options: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    [key: string]: string | undefined;
  };
  correct_option: string | null;
  explanation: string | null;
  // Theory question fields (optional)
  model_answer?: string | null;
  key_points?: string[] | null;
  rubric?: string | null;
  sub_questions?: { label: string; content: string }[] | null;
}

/** Helper to detect if a question is theory type */
export function isTheoryQuestion(question: Question | CBTQuestion): boolean {
  if ('question_type' in question && question.question_type === 'theory') return true;
  const opts = question.options;
  const hasOptions = opts && typeof opts === 'object' && Object.keys(opts).length > 0;
  return !hasOptions;
}
