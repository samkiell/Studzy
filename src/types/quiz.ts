import { Question } from "./cbt";

export interface QuizSession {
  sessionId: string;
  courseId: string;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  startedAt: string;
  completed: boolean;
}

export type QuizSessionUpdate = Partial<Omit<QuizSession, "sessionId" | "courseId" | "questions">>;
