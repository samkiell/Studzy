export interface GradingQuestion {
  id: string;
  question: string;
  answer: string;
  maxScore: number;
  subQuestions?: { label: string; content: string }[];
}

export interface QuestionResult {
  questionId: string;
  score: number;
  feedback: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface ExamResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionResults: QuestionResult[];
}

export interface AIGradingResponse {
  score: number;
  feedback: string;
  strengths?: string[];
  weaknesses?: string[];
}
