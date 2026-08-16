"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { theoryAttempts, theoryQuestions, theorySubQuestions } from "@/lib/db/schema/theory";
import { eq, and, asc } from "drizzle-orm";
import type {
  TheoryAnswers,
  TheoryQuestion,
  TheoryQuestionFeedback,
  TheoryAttemptFeedback,
  AIGradingResponse,
} from "@/types/theory";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

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
 * Grades a single theory question using Gemini AI.
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

  if (!genAI) {
    console.error("[TheoryGrading] GEMINI_API_KEY not set");
    return { score: 0, strengths: [], weaknesses: ["AI grading unavailable."], improvement: "API not configured." };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        responseMimeType: "application/json"
      }
    });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let content = response.response.text();

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
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify attempt ownership
  const [attempt] = await db
    .select()
    .from(theoryAttempts)
    .where(
      and(
        eq(theoryAttempts.id, attempt_id),
        eq(theoryAttempts.user_id, user.id)
      )
    )
    .limit(1);

  if (!attempt) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.completed_at) {
    return attempt.feedback as TheoryAttemptFeedback;
  }

  // Fetch all questions for this exam
  const questions = await db
    .select()
    .from(theoryQuestions)
    .where(eq(theoryQuestions.exam_id, exam_id))
    .orderBy(asc(theoryQuestions.question_number));

  if (!questions || questions.length === 0) {
    throw new Error("Failed to fetch exam questions");
  }

  // Fetch all sub-questions for these questions
  const subQuestions = await db
    .select()
    .from(theorySubQuestions);

  // Map sub_questions properly
  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    ...q,
    key_points: (q.key_points as string[]) || [],
    sub_questions: subQuestions.filter((sq) => sq.question_id === q.id),
  }));

  // Grade each question
  const questionFeedbacks: TheoryQuestionFeedback[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const question of mappedQuestions) {
    const answer = answers[question.id];
    maxScore += question.marks;

    if (!answer) {
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

    if (questionFeedbacks.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
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
  await db
    .update(theoryAttempts)
    .set({
      answers,
      total_score: totalScore,
      max_score: maxScore,
      feedback,
      completed_at: new Date(),
    })
    .where(eq(theoryAttempts.id, attempt_id));

  return feedback;
}

/**
 * Grades a single question in study mode.
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
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the single question
  const [question] = await db
    .select()
    .from(theoryQuestions)
    .where(
      and(
        eq(theoryQuestions.id, question_id),
        eq(theoryQuestions.exam_id, exam_id)
      )
    )
    .limit(1);

  if (!question) {
    throw new Error("Question not found");
  }

  const subQuestions = await db
    .select()
    .from(theorySubQuestions)
    .where(eq(theorySubQuestions.question_id, question_id));

  const mappedQuestion: TheoryQuestion = {
    ...question,
    key_points: (question.key_points as string[]) || [],
    sub_questions: subQuestions || [],
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
