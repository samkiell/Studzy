"use client";

import { useEffect, useMemo } from "react";
import { Question } from "@/types/cbt";
import { useQuizContext } from "@/context/QuizContext";

interface UseQuizSessionProps {
  courseId: string;
  questions: Question[]; // All fetched questions for the course/topic
  sessionId: string;
}

/**
 * Hook that consumes the shared QuizContext.
 */
export function useQuizSession({ courseId, questions, sessionId }: UseQuizSessionProps) {
  const context = useQuizContext();

  const { initialize, startFresh: startFreshContext, resumeExisting: resumeExistingContext } = context;

  // Extract question IDs for session initialization
  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);

  // Initialize the context on mount
  useEffect(() => {
    initialize(sessionId, courseId, questionIds, questions);
  }, [initialize, sessionId, courseId, questionIds, questions]);

  const startFresh = useMemo(() => {
    return () => startFreshContext(sessionId, courseId, questionIds, questions);
  }, [startFreshContext, sessionId, courseId, questionIds, questions]);

  const resumeExisting = useMemo(() => {
    return () => resumeExistingContext(questions);
  }, [resumeExistingContext, questions]);

  return {
    ...context,
    startFresh, 
    resumeExisting,
  };
}
