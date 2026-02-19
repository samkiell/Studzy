"use client";

import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/cbt";
import { QuizSession, QuizSessionUpdate } from "@/types/quiz";
import { quizSessionStorage } from "@/lib/quiz/quizSessionStorage";
import { quizSessionService } from "@/lib/quiz/quizSessionService";

interface UseQuizSessionProps {
  courseId: string;
  questions: Question[];
  sessionId: string;
}

export function useQuizSession({ courseId, questions, sessionId }: UseQuizSessionProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Handle hydration and check for existing session
  useEffect(() => {
    const existingSession = quizSessionStorage.getSession(courseId);
    
    if (existingSession && !existingSession.completed) {
      // If it's the exact same session ID, we can auto-restore
      if (existingSession.sessionId === sessionId) {
        setSession(existingSession);
      } else {
        // It's a different session ID but for the same course
        setHasExistingSession(true);
      }
    } else {
      // No active session, initialize a new one
      const newSession = quizSessionService.initializeNewSession({
        sessionId,
        courseId,
        questions,
      });
      setSession(newSession);
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
      return { ...prev, completed: true };
    });
  }, []);

  const clearSession = useCallback(() => {
    quizSessionStorage.clearSession(courseId);
    setSession(null);
  }, [courseId]);

  const resumeExisting = useCallback(() => {
    const existing = quizSessionService.resumeSession(courseId);
    if (existing) {
      setSession(existing);
      setHasExistingSession(false);
    }
  }, [courseId]);

  const startFresh = useCallback(() => {
    const newSession = quizSessionService.initializeNewSession({
      sessionId,
      courseId,
      questions,
    });
    setSession(newSession);
    setHasExistingSession(false);
  }, [courseId, questions, sessionId]);

  return {
    session,
    isHydrated,
    hasExistingSession,
    updateSession,
    setAnswer,
    setCurrentIndex,
    completeSession,
    clearSession,
    resumeExisting,
    startFresh,
  };
}
