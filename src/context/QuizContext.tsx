"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { QuizSession, QuizSessionUpdate } from "@/types/quiz";
import { quizSessionStorage } from "@/lib/quiz/quizSessionStorage";
import { Question } from "@/types/cbt";
import { quizSessionService } from "@/lib/quiz/quizSessionService";

interface QuizContextType {
  session: QuizSession | null;
  questions: Question[]; // Reconstructed in-order
  isHydrated: boolean;
  hasExistingSession: boolean;
  updateSession: (update: QuizSessionUpdate) => void;
  setAnswer: (questionId: string, option: string) => void;
  setCurrentIndex: (index: number) => void;
  completeSession: () => void;
  clearSession: () => void;
  resumeExisting: (questions: Question[]) => void;
  startFresh: (sessionId: string, courseId: string, questionIds: string[], questions: Question[]) => void;
  initialize: (sessionId: string, courseId: string, questionIds: string[], questions: Question[]) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [allFetchedQuestions, setAllFetchedQuestions] = useState<Question[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (isHydrated && session && activeCourseId) {
      quizSessionStorage.saveSession(session);
    }
  }, [session, isHydrated, activeCourseId]);

  // Reconstruct questions in order based on session.orderedQuestionIds
  const orderedQuestions = useMemo(() => {
    if (!session || !session.orderedQuestionIds || !allFetchedQuestions.length) return [];
    
    return session.orderedQuestionIds
      .map(id => allFetchedQuestions.find(q => q.id === id))
      .filter((q): q is Question => !!q);
  }, [session, allFetchedQuestions]);

  const initialize = useCallback((sessionId: string, courseId: string, questionIds: string[], questions: Question[]) => {
    setActiveCourseId(courseId);
    setAllFetchedQuestions(questions);

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
        questionIds,
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

  const resumeExisting = useCallback((questions: Question[]) => {
    if (activeCourseId) {
      const existing = quizSessionService.resumeSession(activeCourseId);
      if (existing) {
        setAllFetchedQuestions(questions);
        setSession(existing);
        setHasExistingSession(false);
      }
    }
  }, [activeCourseId]);

  const startFresh = useCallback((sessionId: string, courseId: string, questionIds: string[], questions: Question[]) => {
    setAllFetchedQuestions(questions);
    const newSession = quizSessionService.initializeNewSession({
      sessionId,
      courseId,
      questionIds,
    });
    setSession(newSession);
    setHasExistingSession(false);
    setActiveCourseId(courseId);
  }, []);

  return (
    <QuizContext.Provider
      value={{
        session,
        questions: orderedQuestions,
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
