import { QuizSession } from "@/types/quiz";
import { quizSessionStorage } from "./quizSessionStorage";
import { createQuizSession } from "./createQuizSession";

export const quizSessionService = {
  /**
   * Checks if there's an active, uncompleted session for the given course.
   */
  hasActiveSession: (courseId: string): boolean => {
    const session = quizSessionStorage.getSession(courseId);
    return !!session && !session.completed;
  },

  /**
   * Initializes a fresh session, clearing any existing one for the course.
   * Shuffles IDs once.
   */
  initializeNewSession: (params: {
    sessionId: string;
    courseId: string;
    questionIds: string[];
  }): QuizSession => {
    const newSession = createQuizSession(params);
    quizSessionStorage.saveSession(newSession);
    return newSession;
  },

  /**
   * Returns the existing session for a course.
   * No reshuffling happens here.
   */
  resumeSession: (courseId: string): QuizSession | null => {
    return quizSessionStorage.getSession(courseId);
  },

  /**
   * Clears a session for a course.
   */
  clearSession: (courseId: string) => {
    quizSessionStorage.clearSession(courseId);
  }
};
