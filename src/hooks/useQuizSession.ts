"use client";

import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/cbt";
import { QuizSession, QuizSessionUpdate } from "@/types/quiz";
import { quizSessionStorage } from "@/lib/quiz/quizSessionStorage";

interface UseQuizSessionProps {
  courseId: string;
  questions: Question[];
  sessionId: string;
}

export function useQuizSession({ courseId, questions, sessionId }: UseQuizSessionProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and session restoration
  useEffect(() => {
    const existingSession = quizSessionStorage.getSession(courseId);
    
    if (existingSession && !existingSession.completed && existingSession.sessionId === sessionId) {
      setSession(existingSession);
    } else {
      const newSession: QuizSession = {
        sessionId,
        courseId,
        questions,
        currentIndex: 0,
        answers: {},
        startedAt: new Date().toISOString(),
        completed: false,
      };
      setSession(newSession);
      quizSessionStorage.saveSession(newSession);
    }
    
    setIsHydrated(true);
  }, [courseId, questions, sessionId]);

  // Sync session to localStorage on every change
  useEffect(() => {
    if (isHydrated && session) {
      quizSessionStorage.saveSession(session);
    }
  }, [session, isHydrated]);

  const updateSession = useCallback((update: QuizSessionUpdate) => {
    setSession((prev) => {
      if (!prev) return null;
      return { ...prev, ...update };
    });
  }, []);

  const setAnswer = useCallback((questionId: string, option: string) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: option,
        },
      };
    });
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setSession((prev) => {
      if (!prev) return null;
      return { ...prev, currentIndex: index };
    });
  }, []);

  const completeSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return null;
      const completedSession = { ...prev, completed: true };
      // We might want to keep it in storage for a while or clear it
      // For now, let's just mark it as completed.
      // Integration logic in CbtInterface can decide to clear it on final submit.
      return completedSession;
    });
  }, []);

  const clearSession = useCallback(() => {
    quizSessionStorage.clearSession(courseId);
    setSession(null);
  }, [courseId]);

  return {
    session,
    isHydrated,
    updateSession,
    setAnswer,
    setCurrentIndex,
    completeSession,
    clearSession,
  };
}
