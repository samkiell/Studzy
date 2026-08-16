"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { attempts, attemptAnswers, questions } from "@/lib/db/schema/cbt";
import { eq, and, inArray } from "drizzle-orm";
import { isTheoryQuestion } from "@/types/cbt";
import type { Question } from "@/types/cbt";
import { gradeExam } from "@/lib/ai/gradeExam";
import type { GradingQuestion } from "@/types/grading";

// ─── TYPES ──────────────────────────────────────────────────

export interface QuizSubmittedAnswer {
  question_id: string;
  selected_option: string | null;
  theory_answer?: string | null;
  theory_sub_answers?: Record<string, string> | null;
  duration_seconds: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  topic: string | null;
  difficulty?: string | null;
  options: Record<string, string>;
  correct_option: string | null;
  selected_option: string | null;
  is_correct: boolean;
  duration_seconds: number;
  explanation: string | null;
  ai_feedback?: {
    score: number;
    max_marks: number;
    strengths: string[];
    weaknesses: string[];
    improvement: string;
  } | null;
  theory_answer?: string | null;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  completedAt: string;
  topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
  questionsWithAnswers: QuestionResult[];
}

export interface ScoreQuizInput {
  attemptId: string;
  answers: QuizSubmittedAnswer[];
  durationSeconds: number;
}

// ─── MAIN SCORER ────────────────────────────────────────────

export async function scoreQuiz({ attemptId, answers, durationSeconds }: ScoreQuizInput): Promise<QuizResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify attempt ownership
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.user_id, user.id)
      )
    )
    .limit(1);

  if (!attempt) throw new Error("Attempt not found or unauthorized");

  // If already completed, return existing results (idempotent)
  if (attempt.completed_at) {
    return await getExistingResults(attempt);
  }

  const questionIds = (attempt.question_ids as string[]) || [];
  if (questionIds.length === 0) {
    throw new Error("No questions in this attempt");
  }

  // Fetch ALL questions for this attempt
  const fetchedQuestions = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, questionIds));

  // 1. Identify and prepare theory questions for batch grading
  const theoryQuestionsForAI: GradingQuestion[] = [];
  const theoryQuestionsMap = new Map<string, Question>();

  for (const question of fetchedQuestions) {
    if (isTheoryQuestion(question as any)) {
      const ans = answers.find((a) => a.question_id === question.id);
      if (!ans) continue;

      const subQuestions = question.sub_questions as { label: string; content: string }[] | null;
      const parts: string[] = [];
      if (ans.theory_answer?.trim()) parts.push(ans.theory_answer.trim());
      if (ans.theory_sub_answers) {
        Object.entries(ans.theory_sub_answers).forEach(([label, value]) => {
          if (value?.trim()) {
            const sq = subQuestions?.find((s) => s.label === label);
            parts.push(`(${label}) ${sq?.content || ""}\nAnswer: ${value.trim()}`);
          }
        });
      }

      const studentText = parts.join("\n\n");
      if (studentText.trim()) {
        theoryQuestionsForAI.push({
          id: question.id,
          question: question.question_text,
          answer: studentText,
          maxScore: 10,
          subQuestions: subQuestions || undefined,
        });
        theoryQuestionsMap.set(question.id, question as any);
      }
    }
  }

  // 2. Grade all theory questions in one orchestrator call
  const aiResults = theoryQuestionsForAI.length > 0 
    ? await gradeExam(theoryQuestionsForAI, 1, 3) 
    : { questionResults: [] };

  // 3. Process each question for the final payload
  let totalScore = 0;
  let totalMaxScore = 0;
  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = [];
  const attemptAnswersPayload: any[] = [];

  for (const question of fetchedQuestions) {
    const ans = answers.find((a) => a.question_id === question.id);
    const isTheory = isTheoryQuestion(question as any);
    const topic = question.topic || "General";
    const marks = isTheory ? 10 : 1;

    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    totalMaxScore += marks;

    if (!ans) {
      questionsWithAnswers.push({
        question_id: question.id,
        question_text: question.question_text,
        topic: question.topic,
        difficulty: question.difficulty || null,
        options: (question.options as Record<string, string>) || {},
        correct_option: question.correct_option,
        selected_option: null,
        is_correct: false,
        duration_seconds: 0,
        explanation: question.explanation,
        ai_feedback: null,
        theory_answer: null,
      });

      attemptAnswersPayload.push({
        attempt_id: attemptId,
        question_id: question.id,
        selected_option: null,
        is_correct: false,
        theory_answer: null,
        ai_feedback: null,
      });
      continue;
    }

    topicStats[topic].avgTime += ans.duration_seconds;

    let isCorrect = false;
    let aiFeedback: QuestionResult["ai_feedback"] = null;

    if (isTheory) {
      const grading = aiResults.questionResults.find((r) => r.questionId === question.id);
      
      if (grading) {
        aiFeedback = {
          score: grading.score,
          max_marks: marks,
          strengths: grading.strengths || [],
          weaknesses: grading.weaknesses || [],
          improvement: grading.feedback || "",
        };
        totalScore += grading.score;
        isCorrect = grading.score >= marks * 0.5;
        if (isCorrect) topicStats[topic].correct++;
      } else {
        aiFeedback = { score: 0, max_marks: marks, strengths: [], weaknesses: ["Answer was empty or grading failed."], improvement: "Provide a substantive answer." };
      }
    } else {
      isCorrect = question.correct_option === ans.selected_option;
      if (isCorrect) { totalScore++; topicStats[topic].correct++; }
    }

    questionsWithAnswers.push({
      question_id: question.id,
      question_text: question.question_text,
      topic: question.topic,
      difficulty: question.difficulty || null,
      options: (question.options as Record<string, string>) || {},
      correct_option: question.correct_option,
      selected_option: ans.selected_option,
      is_correct: isCorrect,
      duration_seconds: ans.duration_seconds,
      explanation: question.explanation,
      ai_feedback: aiFeedback,
      theory_answer: isTheory ? (ans.theory_answer || Object.values(ans.theory_sub_answers || {}).filter(Boolean).join('\n\n') || null) : null,
    });

    attemptAnswersPayload.push({
      attempt_id: attemptId,
      question_id: question.id,
      selected_option: ans.selected_option,
      is_correct: isCorrect,
      theory_answer: isTheory ? (ans.theory_answer || Object.values(ans.theory_sub_answers || {}).filter(Boolean).join('\n\n') || null) : null,
      ai_feedback: aiFeedback,
    });
  }

  // Finalize topic averages
  Object.values(topicStats).forEach((stats) => {
    stats.avgTime = stats.total > 0 ? Math.round(stats.avgTime / stats.total) : 0;
  });

  // Save answer rows
  if (attemptAnswersPayload.length > 0) {
    try {
      await db.insert(attemptAnswers).values(attemptAnswersPayload);
    } catch (err) {
      console.error("[QuizScorer] Failed to save answers:", err);
    }
  }

  const normalizedScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const completedAt = new Date();

  // Update attempt record
  await db
    .update(attempts)
    .set({
      score: normalizedScore,
      duration_seconds: durationSeconds,
      completed_at: completedAt,
    })
    .where(eq(attempts.id, attemptId));

  const totalCorrect = Object.values(topicStats).reduce((acc, s) => acc + s.correct, 0);
  const totalQuestionsCount = Object.values(topicStats).reduce((acc, s) => acc + s.total, 0);

  const result: QuizResult = {
    score: totalCorrect,
    totalQuestions: totalQuestionsCount,
    completedAt: completedAt.toISOString(),
    topicStats,
    questionsWithAnswers,
  };

  return result;
}

// ─── HELPERS ────────────────────────────────────────────────

async function getExistingResults(attempt: any): Promise<QuizResult> {
  const existingAnswers = await db
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attempt_id, attempt.id));

  const questionIds = (attempt.question_ids as string[]) || [];
  const fetchedQuestions = questionIds.length > 0
    ? await db.select().from(questions).where(inArray(questions.id, questionIds))
    : [];

  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = (existingAnswers || []).map((ans: any) => {
    const q = fetchedQuestions.find((q: any) => q.id === ans.question_id);
    const topic = q?.topic || "General";
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    if (ans.is_correct) topicStats[topic].correct++;
    return {
      question_id: ans.question_id,
      question_text: q?.question_text || "",
      topic: q?.topic || null,
      difficulty: q?.difficulty || null,
      options: (q?.options as Record<string, string>) || {},
      correct_option: q?.correct_option || null,
      selected_option: ans.selected_option,
      is_correct: !!ans.is_correct,
      duration_seconds: 0,
      explanation: q?.explanation || null,
      ai_feedback: ans.ai_feedback,
      theory_answer: ans.theory_answer,
    };
  });

  const totalCorrect = Object.values(topicStats).reduce((acc, s) => acc + s.correct, 0);
  const totalQuestionsCount = Object.values(topicStats).reduce((acc, s) => acc + s.total, 0);

  return {
    score: totalCorrect,
    totalQuestions: totalQuestionsCount,
    completedAt: attempt.completed_at ? new Date(attempt.completed_at).toISOString() : new Date().toISOString(),
    topicStats,
    questionsWithAnswers,
  };
}
