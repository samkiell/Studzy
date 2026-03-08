"use server";

import { createClient } from "@/lib/supabase/server";
import { isTheoryQuestion } from "@/types/cbt";
import type { Question, SubmitAnswer } from "@/types/cbt";
import { gradeExam } from "@/lib/ai/gradeExam";
import type { GradingQuestion } from "@/types/grading";

// ─── TYPES ──────────────────────────────────────────────────

/** A single submitted answer (MCQ or Theory) */
export interface QuizSubmittedAnswer {
  question_id: string;
  /** MCQ: selected option key (e.g. "A"). Theory: null */
  selected_option: string | null;
  /** Theory: main answer text. MCQ: null */
  theory_answer?: string | null;
  /** Theory: sub-question answers { label: value }. MCQ: null */
  theory_sub_answers?: Record<string, string> | null;
  /** Time spent on this question */
  duration_seconds: number;
}

/** Result for a single question after scoring */
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
  /** Theory-only: AI feedback */
  ai_feedback?: {
    score: number;
    max_marks: number;
    strengths: string[];
    weaknesses: string[];
    improvement: string;
  } | null;
  /** Theory-only: student's written answer text */
  theory_answer?: string | null;
}

/** Full quiz submission result */
export interface QuizResult {
  score: number;
  totalQuestions: number;
  completedAt: string;
  topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
  questionsWithAnswers: QuestionResult[];
}

/** Input for the modular scorer */
export interface ScoreQuizInput {
  attemptId: string;
  answers: QuizSubmittedAnswer[];
  durationSeconds: number;
}

// ─── MAIN SCORER ────────────────────────────────────────────

/**
 * Modular quiz scorer that handles both MCQ and theory questions.
 * Scores MCQs deterministically, grades theory questions via AI.
 * Saves results to the database and returns the full result.
 *
 * Can be imported and reused from any component/action.
 */
export async function scoreQuiz({ attemptId, answers, durationSeconds }: ScoreQuizInput): Promise<QuizResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // Verify attempt ownership
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) throw new Error("Attempt not found or unauthorized");

  // If already completed, return existing results (idempotent)
  if (attempt.completed_at) {
    return await getExistingResults(supabase, attempt);
  }

  // Fetch ALL questions for this attempt
  const { data: questions, error: questError } = await supabase
    .from("questions")
    .select("*")
    .in("id", attempt.question_ids || []);

  if (questError || !questions) throw new Error("Failed to fetch questions");

  // 1. Identify and prepare theory questions for batch grading
  const theoryQuestionsForAI: GradingQuestion[] = [];
  const theoryQuestionsMap = new Map<string, Question>();

  for (const question of questions) {
    if (isTheoryQuestion(question)) {
      const ans = answers.find(a => a.question_id === question.id);
      if (!ans) continue;

      const subQuestions = question.sub_questions as { label: string; content: string }[] | null;
      const parts: string[] = [];
      if (ans.theory_answer?.trim()) parts.push(ans.theory_answer.trim());
      if (ans.theory_sub_answers) {
        Object.entries(ans.theory_sub_answers).forEach(([label, value]) => {
          if (value?.trim()) {
            const sq = subQuestions?.find(s => s.label === label);
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
          maxScore: question.marks ?? 10,
          subQuestions: subQuestions || undefined
        });
        theoryQuestionsMap.set(question.id, question);
      }
    }
  }

  // 2. Grade all theory questions in one orchestrator call (handles concurrency/chunking)
  const aiResults = theoryQuestionsForAI.length > 0 
    ? await gradeExam(theoryQuestionsForAI, 1, 3) 
    : { questionResults: [] };

  // 3. Process each question for the final payload
  let totalScore = 0;
  let totalMaxScore = 0;
  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = [];
  const attemptAnswersPayload: any[] = [];

  for (const question of questions) {
    const ans = answers.find(a => a.question_id === question.id);
    const isTheory = isTheoryQuestion(question);
    const topic = question.topic || "General";
    const marks = question.marks ?? (isTheory ? 10 : 1);

    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    totalMaxScore += marks;

    if (!ans) {
      questionsWithAnswers.push({
        question_id: question.id,
        question_text: question.question_text,
        topic: question.topic,
        difficulty: question.difficulty || null,
        options: question.options || {},
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
      const grading = aiResults.questionResults.find(r => r.questionId === question.id);
      
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
        // Fallback for unanswered or failed theory grading
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
      options: question.options || {},
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
  Object.values(topicStats).forEach(stats => {
    stats.avgTime = stats.total > 0 ? Math.round(stats.avgTime / stats.total) : 0;
  });

  // Save answer rows
  const { error: answersError } = await supabase.from("attempt_answers").insert(attemptAnswersPayload);
  if (answersError && answersError.code !== "23505") {
    console.error("[QuizScorer] Failed to save answers:", answersError);
    throw new Error("Failed to save answers");
  }

  // Normalize score to 100 before saving
  const normalizedScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // Update attempt record
  const completedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      score: normalizedScore,
      duration_seconds: durationSeconds,
      completed_at: completedAt,
    })
    .eq("id", attemptId);

  if (updateError) {
    console.error("[QuizScorer] Failed to update attempt:", updateError);
    throw new Error("Failed to update attempt");
  }

  const totalCorrect = Object.values(topicStats).reduce((acc, s) => acc + s.correct, 0);
  const totalQuestionsCount = Object.values(topicStats).reduce((acc, s) => acc + s.total, 0);

  const result: QuizResult = {
    score: totalCorrect,
    totalQuestions: totalQuestionsCount,
    completedAt,
    topicStats,
    questionsWithAnswers,
  };

  return result;
}

// ─── HELPERS ────────────────────────────────────────────────

async function getExistingResults(supabase: any, attempt: any): Promise<QuizResult> {
  const { data: existingAnswers } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option, is_correct, theory_answer, ai_feedback")
    .eq("attempt_id", attempt.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_option, topic, difficulty, explanation, marks")
    .in("id", attempt.question_ids || []);

  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = (existingAnswers || []).map((ans: any) => {
    const q = (questions || []).find((q: any) => q.id === ans.question_id);
    const topic = q?.topic || "General";
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    if (ans.is_correct) topicStats[topic].correct++;
    return {
      question_id: ans.question_id,
      question_text: q?.question_text || "",
      topic: q?.topic || null,
      difficulty: q?.difficulty || null,
      options: q?.options || {},
      correct_option: q?.correct_option || null,
      selected_option: ans.selected_option,
      is_correct: ans.is_correct,
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
    completedAt: attempt.completed_at,
    topicStats,
    questionsWithAnswers,
  };
}
