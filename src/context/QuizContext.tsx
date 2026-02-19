"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { QuizSession, QuizSessionUpdate } from "@/types/quiz";
import { quizSessionStorage } from "@/lib/quiz/quizSessionStorage";
import { Question } from "@/types/cbt";
import { quizSessionService } from "@/lib/quiz/quizSessionService";

interface QuizContextType {
  session: QuizSession | null;
  isHydrated: boolean;
  hasExistingSession: boolean;
  updateSession: (update: QuizSessionUpdate) => void;
  setAnswer: (questionId: string, option: string) => void;
  setCurrentIndex: (index: number) => void;
  completeSession: () => void;
  clearSession: () => void;
  resumeExisting: () => void;
  startFresh: (sessionId: string, courseId: string, questions: Question[]) => void;
  initialize: (sessionId: string, courseId: string, questions: Question[]) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (isHydrated && session && activeCourseId) {
      quizSessionStorage.saveSession(session);
    }
  }, [session, isHydrated, activeCourseId]);

  const initialize = useCallback((sessionId: string, courseId: string, questions: Question[]) => {
    setActiveCourseId(courseId);
    const existingSession = quizSessionStorage.getSession(courseId);
    
    if (existingSession && !existingSession.completed) {
      if (existingSession.sessionId === sessionId) {
        setSession(existingSession);
        setHasExistingSession(false);
      } else {
        setHasExistingSession(true);
      }
    } else {
      const newSession = quizSessionService.initializeNewSession({
        sessionId,
        courseId,
        questions,
      });
      setSession(newSession);
      setHasExistingSession(false);
    }
    setIsHydrated(true);
  }, []);

  const updateSession = useCallback((update: QuizSessionUpdate) => {
    setSession((prev) => (prev ? { ...prev, ...update } : null));
  }, []);

  const setAnswer = useCallback((questionId: string, option: string) => {
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: option },
      };
    });
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setSession((prev) => (prev ? { ...prev, currentIndex: index } : null));
  }, []);

  const completeSession = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, completed: true } : null));
  }, []);

  const clearSession = useCallback(() => {
    if (activeCourseId) {
      quizSessionStorage.clearSession(activeCourseId);
    }
    setSession(null);
  }, [activeCourseId]);

  const resumeExisting = useCallback(() => {
    if (activeCourseId) {
      const existing = quizSessionService.resumeSession(activeCourseId);
      if (existing) {
        setSession(existing);
        setHasExistingSession(false);
      }
    }
  }, [activeCourseId]);

  const startFresh = useCallback((sessionId: string, courseId: string, questions: Question[]) => {
    const newSession = quizSessionService.initializeNewSession({
      sessionId,
      courseId,
      questions,
    });
    setSession(newSession);
    setHasExistingSession(false);
    setActiveCourseId(courseId);
  }, []);

  return (
    <QuizContext.Provider
      value={{
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
        initialize,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuizContext must be used within a QuizProvider");
  }
  return context;
}
