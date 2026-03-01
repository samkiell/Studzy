export type TheoryExamMode = "study" | "exam";

export interface TheoryExam {
  id: string;
  course_id: string;
  title: string;
  instructions: string | null;
  exam_mode: TheoryExamMode;
  max_selectable_questions: number | null;
  created_at: string;
}

export interface TheoryQuestion {
  id: string;
  exam_id: string;
  question_number: number;
  main_question: string;
  marks: number;
  model_answer: string;
  key_points: string[];
  rubric: string | null;
  sub_questions?: TheorySubQuestion[];
}

export interface TheorySubQuestion {
  id: string;
  question_id: string;
  label: string;
  content: string;
}

export interface TheoryAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  answers: TheoryAnswers;
  total_score: number;
  max_score: number;
  feedback: TheoryAttemptFeedback | null;
  started_at: string;
  completed_at: string | null;
}

/** Structured answer state used in both frontend and database */
export interface TheoryAnswers {
  [questionId: string]: {
    main?: string;
    sub: Record<string, string>;
  };
}

/** Feedback for a single graded question */
export interface TheoryQuestionFeedback {
  question_id: string;
  question_number: number;
  score: number;
  max_marks: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

/** Aggregated feedback stored in theory_attempts.feedback */
export interface TheoryAttemptFeedback {
  questions: TheoryQuestionFeedback[];
  total_score: number;
  max_score: number;
  graded_at: string;
}

/** The strict JSON schema the AI must return per question */
export interface AIGradingResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

/** Data passed to the grading server action */
export interface GradeTheoryExamInput {
  attempt_id: string;
  exam_id: string;
  answers: TheoryAnswers;
}

/** A single question bundled with its grading context for the AI */
export interface GradingContext {
  question: TheoryQuestion;
  student_answer: string;
}

/** Full exam data with questions, used after starting an attempt */
export interface TheoryExamSession {
  attempt: TheoryAttempt;
  exam: TheoryExam;
  questions: TheoryQuestion[];
}
