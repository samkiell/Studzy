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
  // Marks per question (MCQ defaults to 1, theory can be higher)
  marks?: number;
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
  // Explicit type flag takes priority
  if ('question_type' in question && question.question_type === 'theory') return true;
  if ('question_type' in question && question.question_type === 'mcq') return false;
  
  // Fall back to detecting based on options content
  const opts = question.options;
  
  // No options at all → theory
  if (!opts) return true;
  
  // Array form: empty array or array of empty/null strings → theory
  if (Array.isArray(opts)) {
    const nonEmpty = opts.filter((v: any) => v && String(v).trim());
    return nonEmpty.length === 0;
  }
  
  // Object form: empty object or all values are empty strings → theory
  if (typeof opts === 'object') {
    const keys = Object.keys(opts);
    if (keys.length === 0) return true;
    const nonEmpty = keys.filter(k => {
      const v = (opts as Record<string, string>)[k];
      return v && String(v).trim();
    });
    return nonEmpty.length === 0;
  }
  
  return false;
}
