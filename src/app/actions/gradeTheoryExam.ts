"use server";

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";
import type {
  TheoryAnswers,
  TheoryQuestion,
  TheoryQuestionFeedback,
  TheoryAttemptFeedback,
  AIGradingResponse,
} from "@/types/theory";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: MISTRAL_API_KEY });

/**
 * Builds the combined student answer string from main + sub answers.
 */
function buildStudentAnswerText(
  answer: { main?: string; sub: Record<string, string> },
  question: TheoryQuestion
): string {
  const parts: string[] = [];

  if (answer.main?.trim()) {
    parts.push(`Main Answer:\n${answer.main.trim()}`);
  }

  if (question.sub_questions && question.sub_questions.length > 0) {
    for (const sq of question.sub_questions) {
      const subAnswer = answer.sub[sq.label] || "";
      if (subAnswer.trim()) {
        parts.push(`(${sq.label}) ${sq.content}\nAnswer: ${subAnswer.trim()}`);
      }
    }
  }

  return parts.join("\n\n");
}

/**
 * Grades a single theory question using Mistral AI.
 * Returns a strict JSON response clamped to max marks.
 */
async function gradeTheoryQuestion(
  question: TheoryQuestion,
  studentAnswerText: string
): Promise<AIGradingResponse> {
  const keyPointsStr = question.key_points.map((kp, i) => `${i + 1}. ${kp}`).join("\n");

  const prompt = `You are an academic examiner.
Grade the student answer strictly using the provided rubric.
Do not be lenient.
Do not reward irrelevant content.
Only evaluate based on key points.

Question (${question.marks} marks):
"${question.main_question}"

Model Answer:
"${question.model_answer}"

Key Points:
${keyPointsStr}

${question.rubric ? `Rubric:\n${question.rubric}\n` : ""}
Student's Answer:
"${studentAnswerText}"

Return only valid JSON with this exact structure:
{
  "score": <number between 0 and ${question.marks}>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "improvement": "<specific advice for improvement>"
}

IMPORTANT:
- score MUST be a number between 0 and ${question.marks}
- Do NOT exceed ${question.marks} marks
- Be strict and fair
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
      maxTokens: 512,
      temperature: 0.1,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    let content = "";

    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      content = rawContent
        .map((part) => (typeof part === "string" ? part : (part as any).text || ""))
        .join("");
    }

    const parsed: AIGradingResponse = JSON.parse(content);

    // Clamp score to max marks — never trust AI to respect limits
    parsed.score = Math.max(0, Math.min(parsed.score, question.marks));

    // Ensure arrays
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.weaknesses)) parsed.weaknesses = [];
    if (typeof parsed.improvement !== "string") parsed.improvement = "";

    return parsed;
  } catch (error) {
    console.error(`[TheoryGrading] Failed to grade question ${question.question_number}:`, error);
    // Fallback: return zero score with error feedback
    return {
      score: 0,
      strengths: [],
      weaknesses: ["Grading failed due to a system error. Please retry."],
      improvement: "Please resubmit this exam for grading.",
    };
  }
}

/**
 * Grades a full theory exam attempt.
 * Loops through each answered question, grades via AI, aggregates, and saves to DB.
 */
export async function gradeTheoryExam({
  attempt_id,
  exam_id,
  answers,
}: {
  attempt_id: string;
  exam_id: string;
  answers: TheoryAnswers;
}): Promise<TheoryAttemptFeedback> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Verify attempt ownership
  const { data: attempt, error: attemptError } = await supabase
    .from("theory_attempts")
    .select("*")
    .eq("id", attempt_id)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.completed_at) {
    // Already graded — return existing feedback
    return attempt.feedback as TheoryAttemptFeedback;
  }

  // Fetch all questions with sub-questions for this exam
  const { data: questions, error: questionsError } = await supabase
    .from("theory_questions")
    .select("*, theory_sub_questions(*)")
    .eq("exam_id", exam_id)
    .order("question_number");

  if (questionsError || !questions) {
    throw new Error("Failed to fetch exam questions");
  }

  // Map sub_questions properly
  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    ...q,
    sub_questions: q.theory_sub_questions || [],
  }));

  // Grade each question
  const questionFeedbacks: TheoryQuestionFeedback[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const question of mappedQuestions) {
    const answer = answers[question.id];
    maxScore += question.marks;

    if (!answer) {
      // Unanswered question
      questionFeedbacks.push({
        question_id: question.id,
        question_number: question.question_number,
        score: 0,
        max_marks: question.marks,
        strengths: [],
        weaknesses: ["Question was not answered."],
        improvement: "Attempt all questions to maximize your score.",
      });
      continue;
    }

    const studentAnswerText = buildStudentAnswerText(answer, question);

    if (!studentAnswerText.trim()) {
      questionFeedbacks.push({
        question_id: question.id,
        question_number: question.question_number,
        score: 0,
        max_marks: question.marks,
        strengths: [],
        weaknesses: ["Answer was empty."],
        improvement: "Provide a substantive answer addressing the key points.",
      });
      continue;
    }

    const grading = await gradeTheoryQuestion(question, studentAnswerText);

    totalScore += grading.score;
    questionFeedbacks.push({
      question_id: question.id,
      question_number: question.question_number,
      score: grading.score,
      max_marks: question.marks,
      strengths: grading.strengths,
      weaknesses: grading.weaknesses,
      improvement: grading.improvement,
    });
  }

  const feedback: TheoryAttemptFeedback = {
    questions: questionFeedbacks,
    total_score: totalScore,
    max_score: maxScore,
    graded_at: new Date().toISOString(),
  };

  // Save to database
  const { error: updateError } = await supabase
    .from("theory_attempts")
    .update({
      answers,
      total_score: totalScore,
      max_score: maxScore,
      feedback,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attempt_id);

  if (updateError) {
    console.error("[TheoryGrading] Failed to save attempt:", updateError);
    throw new Error("Failed to save grading results");
  }

  return feedback;
}

/**
 * Grades a single question in study mode (immediate feedback).
 */
export async function gradeTheoryQuestionStudyMode({
  question_id,
  exam_id,
  answer,
}: {
  question_id: string;
  exam_id: string;
  answer: { main?: string; sub: Record<string, string> };
}): Promise<TheoryQuestionFeedback> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch the single question with sub-questions
  const { data: question, error: questionError } = await supabase
    .from("theory_questions")
    .select("*, theory_sub_questions(*)")
    .eq("id", question_id)
    .eq("exam_id", exam_id)
    .single();

  if (questionError || !question) {
    throw new Error("Question not found");
  }

  const mappedQuestion: TheoryQuestion = {
    ...question,
    sub_questions: question.theory_sub_questions || [],
  };

  const studentAnswerText = buildStudentAnswerText(answer, mappedQuestion);

  if (!studentAnswerText.trim()) {
    return {
      question_id: question.id,
      question_number: question.question_number,
      score: 0,
      max_marks: question.marks,
      strengths: [],
      weaknesses: ["Answer was empty."],
      improvement: "Provide a substantive answer addressing the key points.",
    };
  }

  const grading = await gradeTheoryQuestion(mappedQuestion, studentAnswerText);

  return {
    question_id: question.id,
    question_number: question.question_number,
    score: grading.score,
    max_marks: question.marks,
    strengths: grading.strengths,
    weaknesses: grading.weaknesses,
    improvement: grading.improvement,
  };
}
