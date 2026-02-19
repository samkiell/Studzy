import { QuizSession } from "@/types/quiz";
import { shuffle } from "../utils/shuffle";

/**
 * Handles the initial creation of a quiz session object.
 * Shuffles the provided question IDs exactly once.
 */
export function createQuizSession(params: {
  sessionId: string;
  courseId: string;
  questionIds: string[];
}): QuizSession {
  return {
    sessionId: params.sessionId,
    courseId: params.courseId,
    orderedQuestionIds: params.questionIds,
    currentIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    completed: false,
  };
}
