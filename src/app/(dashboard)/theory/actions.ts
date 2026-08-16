"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { theoryExams, theoryQuestions, theorySubQuestions, theoryAttempts } from "@/lib/db/schema/theory";
import { eq, and, desc, asc } from "drizzle-orm";
import type {
  TheoryExam,
  TheoryQuestion,
  TheoryAttempt,
  TheoryExamSession,
  TheoryAnswers,
} from "@/types/theory";

/**
 * Fetches all theory exams for a given course.
 */
export async function getTheoryExams(courseId: string): Promise<TheoryExam[]> {
  const exams = await db
    .select()
    .from(theoryExams)
    .where(eq(theoryExams.course_id, courseId))
    .orderBy(desc(theoryExams.created_at));

  return (exams || []) as unknown as TheoryExam[];
}

/**
 * Starts a new theory attempt: creates an attempt row and returns the exam session data.
 */
export async function startTheoryAttempt(
  examId: string
): Promise<TheoryExamSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch exam
  const [exam] = await db
    .select()
    .from(theoryExams)
    .where(eq(theoryExams.id, examId))
    .limit(1);

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Fetch questions with sub-questions
  const questions = await db
    .select()
    .from(theoryQuestions)
    .where(eq(theoryQuestions.exam_id, examId))
    .orderBy(asc(theoryQuestions.question_number));

  const subQuestions = await db
    .select()
    .from(theorySubQuestions);

  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    id: q.id,
    exam_id: q.exam_id,
    question_number: q.question_number,
    main_question: q.main_question,
    marks: q.marks,
    model_answer: q.model_answer,
    key_points: (q.key_points as string[]) || [],
    rubric: q.rubric,
    sub_questions: subQuestions.filter((sq) => sq.question_id === q.id),
  }));

  const maxScore = mappedQuestions.reduce((sum, q) => sum + q.marks, 0);

  // Create attempt
  const [attempt] = await db
    .insert(theoryAttempts)
    .values({
      user_id: user.id,
      exam_id: examId,
      answers: {},
      total_score: 0,
      max_score: maxScore,
    })
    .returning();

  return {
    attempt: attempt as unknown as TheoryAttempt,
    exam: exam as unknown as TheoryExam,
    questions: mappedQuestions,
  };
}

/**
 * Saves partial progress for a theory attempt (answers only).
 */
export async function saveTheoryProgress(
  attemptId: string,
  answers: TheoryAnswers
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await db
    .update(theoryAttempts)
    .set({ answers })
    .where(
      and(
        eq(theoryAttempts.id, attemptId),
        eq(theoryAttempts.user_id, user.id)
      )
    );
}

/**
 * Fetches a theory attempt session (for resuming or viewing results).
 */
export async function getTheoryAttemptSession(
  attemptId: string
): Promise<TheoryExamSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch attempt
  const [attempt] = await db
    .select()
    .from(theoryAttempts)
    .where(
      and(
        eq(theoryAttempts.id, attemptId),
        eq(theoryAttempts.user_id, user.id)
      )
    )
    .limit(1);

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  // Fetch exam
  const [exam] = await db
    .select()
    .from(theoryExams)
    .where(eq(theoryExams.id, attempt.exam_id))
    .limit(1);

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Fetch questions
  const questions = await db
    .select()
    .from(theoryQuestions)
    .where(eq(theoryQuestions.exam_id, attempt.exam_id))
    .orderBy(asc(theoryQuestions.question_number));

  const subQuestions = await db
    .select()
    .from(theorySubQuestions);

  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    id: q.id,
    exam_id: q.exam_id,
    question_number: q.question_number,
    main_question: q.main_question,
    marks: q.marks,
    model_answer: q.model_answer,
    key_points: (q.key_points as string[]) || [],
    rubric: q.rubric,
    sub_questions: subQuestions.filter((sq) => sq.question_id === q.id),
  }));

  return {
    attempt: attempt as unknown as TheoryAttempt,
    exam: exam as unknown as TheoryExam,
    questions: mappedQuestions,
  };
}
