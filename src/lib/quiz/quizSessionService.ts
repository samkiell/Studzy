import { Question } from "@/types/cbt";
import { QuizSession } from "@/types/quiz";
import { quizSessionStorage } from "./quizSessionStorage";

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
   */
  initializeNewSession: (params: {
    sessionId: string;
    courseId: string;
    questions: Question[];
  }): QuizSession => {
    const newSession: QuizSession = {
      sessionId: params.sessionId,
      courseId: params.courseId,
      questions: params.questions,
      currentIndex: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      completed: false,
    };
    quizSessionStorage.saveSession(newSession);
    return newSession;
  },

  /**
   * Returns the existing session for a course.
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
