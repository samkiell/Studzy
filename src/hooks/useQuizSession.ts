"use client";

import { useEffect, useMemo } from "react";
import { Question } from "@/types/cbt";
import { useQuizContext } from "@/context/QuizContext";

interface UseQuizSessionProps {
  courseId: string;
  questions: Question[];
  sessionId: string;
}

/**
 * Hook that consumes the shared QuizContext.
 * If used outside a QuizProvider, it will throw an error.
 */
export function useQuizSession({ courseId, questions, sessionId }: UseQuizSessionProps) {
  const context = useQuizContext();

  const { initialize, startFresh: startFreshContext } = context;

  // Initialize the context on mount
  useEffect(() => {
    initialize(sessionId, courseId, questions);
  }, [initialize, sessionId, courseId, questions]);

  const startFresh = useMemo(() => {
    return () => startFreshContext(sessionId, courseId, questions);
  }, [startFreshContext, sessionId, courseId, questions]);

  return {
    ...context,
    startFresh, // Override startFresh to pre-fill arguments
  };
}
