"use server";

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";
import { isTheoryQuestion } from "@/types/cbt";
import type { Question, SubmitAnswer } from "@/types/cbt";

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

// ─── AI GRADING ─────────────────────────────────────────────

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_AI_AGENT_ID = process.env.MISTRAL_AI_AGENT_ID;

async function gradeTheoryAnswer(
  question: Question,
  studentAnswer: string
): Promise<{ score: number; max_marks: number; strengths: string[]; weaknesses: string[]; improvement: string }> {
  if (!MISTRAL_API_KEY || !MISTRAL_AI_AGENT_ID) {
    console.error("[QuizScorer] MISTRAL_API_KEY or MISTRAL_AI_AGENT_ID not set, returning zero score");
    return { score: 0, max_marks: question.marks ?? 10, strengths: [], weaknesses: ["AI grading unavailable."], improvement: "Please resubmit." };
  }

  const client = new Mistral({ apiKey: MISTRAL_API_KEY });
  const marks = question.marks ?? 10;
  const keyPoints = Array.isArray(question.key_points) ? question.key_points.map((kp, i) => `${i + 1}. ${kp}`).join("\n") : "None specified";

  const prompt = `You are an academic examiner. Grade the student answer strictly using the provided rubric.
Do not be lenient. Do not reward irrelevant content. Only evaluate based on key points.

Question (${marks} marks):
"${question.question_text}"

${question.model_answer ? `Model Answer:\n"${question.model_answer}"\n` : ""}
Key Points:
${keyPoints}

${question.rubric ? `Rubric:\n${question.rubric}\n` : ""}
Student's Answer:
"${studentAnswer}"

Return only valid JSON with this exact structure:
{
  "score": <number between 0 and ${marks}>,
  "strengths": ["<strength 1>"],
  "weaknesses": ["<weakness 1>"],
  "improvement": "<specific advice>"
}

IMPORTANT: score MUST be between 0 and ${marks}. Be strict. Return ONLY the JSON object.`;

  try {
    const response = await client.agents.complete({
      agentId: MISTRAL_AI_AGENT_ID,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 512,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    let content = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((p: any) => typeof p === "string" ? p : p.text || "").join("") : "";

    // Strip markdown code fences if the agent wraps the JSON in ```json ... ```
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const parsed = JSON.parse(content);
    return {
      score: Math.max(0, Math.min(parsed.score ?? 0, marks)),
      max_marks: marks,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvement: typeof parsed.improvement === "string" ? parsed.improvement : "",
    };
  } catch (error) {
    console.error("[QuizScorer] AI grading failed:", error);
    return { score: 0, max_marks: marks, strengths: [], weaknesses: ["Grading failed due to system error."], improvement: "Please retry." };
  }
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

  // Fetch questions
  const questionIds = answers.map(a => a.question_id);
  const { data: questions, error: questError } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  if (questError || !questions) throw new Error("Failed to fetch questions");

  // Score each question
  let totalScore = 0;
  let totalMaxScore = 0;
  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const questionsWithAnswers: QuestionResult[] = [];
  const attemptAnswersPayload: any[] = [];

  for (const ans of answers) {
    const question = questions.find(q => q.id === ans.question_id);
    if (!question) continue;

    const isTheory = isTheoryQuestion(question);
    const topic = question.topic || "General";

    console.log(`[QuizScorer] Q:${question.id.slice(0,8)} type=${isTheory ? 'theory' : 'mcq'} hasTheoryAnswer=${!!ans.theory_answer} hasSubAnswers=${!!ans.theory_sub_answers} selectedOption=${ans.selected_option}`);

    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
    topicStats[topic].total++;
    topicStats[topic].avgTime += ans.duration_seconds;

    let isCorrect = false;
    let aiFeedback: QuestionResult["ai_feedback"] = null;

    if (isTheory) {
      // Build full student answer text
      const parts: string[] = [];
      if (ans.theory_answer?.trim()) parts.push(ans.theory_answer.trim());
      if (ans.theory_sub_answers) {
        const subQuestions = question.sub_questions as { label: string; content: string }[] | null;
        Object.entries(ans.theory_sub_answers).forEach(([label, value]) => {
          if (value?.trim()) {
            const sq = subQuestions?.find(s => s.label === label);
            parts.push(`(${label}) ${sq?.content || ""}\nAnswer: ${value.trim()}`);
          }
        });
      }

      const studentText = parts.join("\n\n");
      const marks = question.marks ?? 10;

      if (studentText.trim()) {
        const grading = await gradeTheoryAnswer(question, studentText);
        aiFeedback = grading;
        totalScore += grading.score;
        totalMaxScore += marks;
        isCorrect = grading.score >= marks * 0.5; // 50%+ = "correct" for topic stats
        if (isCorrect) topicStats[topic].correct++;
      } else {
        aiFeedback = { score: 0, max_marks: marks, strengths: [], weaknesses: ["Answer was empty."], improvement: "Provide a substantive answer." };
        totalMaxScore += marks;
      }
    } else {
      // MCQ: deterministic scoring
      isCorrect = question.correct_option === ans.selected_option;
      if (isCorrect) { totalScore++; topicStats[topic].correct++; }
      totalMaxScore++;
    }

    questionsWithAnswers.push({
      question_id: question.id,
      question_text: question.question_text,
      topic: question.topic,
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
      question_id: ans.question_id,
      selected_option: ans.selected_option,
      is_correct: isCorrect,
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

  const result: QuizResult = {
    score: normalizedScore,
    totalQuestions: 100, // Always out of 100
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
    .select("question_id, selected_option, is_correct")
    .eq("attempt_id", attempt.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_option, topic, explanation")
    .in("id", (existingAnswers || []).map((a: any) => a.question_id));

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
      options: q?.options || {},
      correct_option: q?.correct_option || null,
      selected_option: ans.selected_option,
      is_correct: ans.is_correct,
      duration_seconds: 0,
      explanation: q?.explanation || null,
      ai_feedback: null,
    };
  });

  return {
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    completedAt: attempt.completed_at,
    topicStats,
    questionsWithAnswers,
  };
}
