"use server";

import { localProvider } from "@/lib/cbt/providers/localProvider";
import { createQuizSession } from "@/lib/quiz/createQuizSession";
import { scoreLocalQuiz } from "@/lib/cbt/localScorer";
import { isTheoryQuestion, Question, SubmitAnswer } from "@/types/cbt";
import { QuizResult, QuizSubmittedAnswer } from "@/lib/cbt/quizScorer";

export interface PublicAttempt {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  mode: "study" | "exam";
  total_questions: number;
  score: number;
  duration_seconds: number;
  time_limit_seconds: number;
  started_at: string;
  question_ids: string[];
  completed_at: string | null;
}

export async function startPublicCbtAttempt(params: {
  courseId: string;
  mode: "study" | "exam";
  numberOfQuestions: number;
  topic?: string;
  timeLimitMinutes?: number;
  difficulty?: string;
}): Promise<{ attempt: PublicAttempt; questions: Question[] }> {
  const courseId = params.courseId.toUpperCase();
  const questions = localProvider.getFilteredQuestions(courseId, {
    topic: params.topic,
    difficulty: params.difficulty,
    count: params.numberOfQuestions,
  });

  if (questions.length === 0) {
    throw new Error("No questions found matching your filters");
  }

  const questionIds = questions.map((q) => q.id);
  const attemptId = `public_${courseId}_${Date.now()}`;
  const now = new Date().toISOString();

  const attempt: PublicAttempt = {
    id: attemptId,
    course_id: courseId,
    course_title: courseId,
    course_code: courseId,
    mode: params.mode,
    total_questions: questions.length,
    score: 0,
    duration_seconds: 0,
    time_limit_seconds: (params.timeLimitMinutes || 30) * 60,
    started_at: now,
    question_ids: questionIds,
    completed_at: null,
  };

  const session = createQuizSession({
    sessionId: attemptId,
    courseId,
    questionIds,
  });

  if (typeof window !== "undefined") {
    const storageKey = `studzy_quiz_session_${courseId}`;
    localStorage.setItem(storageKey, JSON.stringify(session));
    const attemptsKey = `studzy_public_attempts_${courseId}`;
    let attempts: PublicAttempt[] = [];
    try {
      const existing = localStorage.getItem(attemptsKey);
      if (existing) attempts = JSON.parse(existing);
    } catch {
      // ignore
    }
    attempts.push(attempt);
    localStorage.setItem(attemptsKey, JSON.stringify(attempts));
  }

  return { attempt, questions };
}

export async function submitPublicCbtAttempt(params: {
  attemptId: string;
  answers: SubmitAnswer[];
  durationSeconds: number;
  theoryAnswers?: Record<string, { main?: string; sub: Record<string, string> }>;
  questionDurations: Record<string, number>;
  questions: Question[];
}): Promise<QuizResult> {
  const { attemptId, answers, durationSeconds, theoryAnswers, questionDurations, questions } = params;

  const submittedAnswers: QuizSubmittedAnswer[] = [];

  for (const ans of answers) {
    submittedAnswers.push({
      question_id: ans.question_id,
      selected_option: ans.selected_option,
      theory_answer: null,
      theory_sub_answers: null,
      duration_seconds: ans.duration_seconds,
    });
  }

  if (theoryAnswers) {
    for (const [questionId, answer] of Object.entries(theoryAnswers)) {
      if (submittedAnswers.find((a) => a.question_id === questionId)) continue;
      submittedAnswers.push({
        question_id: questionId,
        selected_option: null,
        theory_answer: answer.main || null,
        theory_sub_answers: Object.keys(answer.sub).length > 0 ? answer.sub : null,
        duration_seconds: questionDurations[questionId] || 0,
      });
    }
  }

  const result = scoreLocalQuiz({
    questions,
    answers: submittedAnswers,
    durationSeconds,
    questionDurations,
  });

  if (typeof window !== "undefined") {
    const courseId = questions[0]?.course_id || "CIS214";
    const attemptsKey = `studzy_public_attempts_${courseId}`;
    try {
      const existing = localStorage.getItem(attemptsKey);
      if (existing) {
        const attempts: PublicAttempt[] = JSON.parse(existing);
        const idx = attempts.findIndex((a) => a.id === attemptId);
        if (idx >= 0) {
          attempts[idx] = {
            ...attempts[idx],
            completed_at: result.completedAt,
            score: result.score,
            duration_seconds: durationSeconds,
          };
          localStorage.setItem(attemptsKey, JSON.stringify(attempts));
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  return result;
}
