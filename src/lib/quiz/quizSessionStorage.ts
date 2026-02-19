import { QuizSession } from "@/types/quiz";

const STORAGE_KEY_PREFIX = "studzy_quiz_session_";

export const quizSessionStorage = {
  saveSession: (session: QuizSession) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${session.courseId}`, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save quiz session to localStorage:", error);
    }
  },

  getSession: (courseId: string): QuizSession | null => {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseId}`);
      if (!data) return null;
      return JSON.parse(data) as QuizSession;
    } catch (error) {
      console.error("Failed to get quiz session from localStorage:", error);
      return null;
    }
  },

  clearSession: (courseId: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${courseId}`);
  },

  getAllSessions: (): QuizSession[] => {
    if (typeof window === "undefined") return [];
    const sessions: QuizSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            sessions.push(JSON.parse(data));
          }
        } catch (e) {
          console.error(`Failed to parse session at key ${key}`, e);
        }
      }
    }
    return sessions;
  }
};
