"use server";

import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("theory_exams")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Theory] Failed to fetch exams:", error);
    throw new Error("Failed to fetch theory exams");
  }

  return (data || []) as TheoryExam[];
}

/**
 * Starts a new theory attempt: creates an attempt row and returns the exam session data.
 */
export async function startTheoryAttempt(
  examId: string
): Promise<TheoryExamSession> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch exam
  const { data: exam, error: examError } = await supabase
    .from("theory_exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    throw new Error("Exam not found");
  }

  // Fetch questions with sub-questions
  const { data: questions, error: questionsError } = await supabase
    .from("theory_questions")
    .select("*, theory_sub_questions(*)")
    .eq("exam_id", examId)
    .order("question_number");

  if (questionsError || !questions) {
    throw new Error("Failed to fetch questions");
  }

  // Map sub_questions
  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    id: q.id,
    exam_id: q.exam_id,
    question_number: q.question_number,
    main_question: q.main_question,
    marks: q.marks,
    model_answer: q.model_answer,
    key_points: q.key_points,
    rubric: q.rubric,
    sub_questions: q.theory_sub_questions || [],
  }));

  // Calculate max score
  const maxScore = mappedQuestions.reduce((sum, q) => sum + q.marks, 0);

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("theory_attempts")
    .insert({
      user_id: user.id,
      exam_id: examId,
      answers: {},
      total_score: 0,
      max_score: maxScore,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    console.error("[Theory] Failed to create attempt:", attemptError);
    throw new Error("Failed to create attempt");
  }

  return {
    attempt: attempt as TheoryAttempt,
    exam: exam as TheoryExam,
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("theory_attempts")
    .update({ answers })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[Theory] Failed to save progress:", error);
    throw new Error("Failed to save progress");
  }
}

/**
 * Fetches a theory attempt session (for resuming or viewing results).
 */
export async function getTheoryAttemptSession(
  attemptId: string
): Promise<TheoryExamSession> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("theory_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found");
  }

  // Fetch exam
  const { data: exam, error: examError } = await supabase
    .from("theory_exams")
    .select("*")
    .eq("id", attempt.exam_id)
    .single();

  if (examError || !exam) {
    throw new Error("Exam not found");
  }

  // Fetch questions
  const { data: questions, error: questionsError } = await supabase
    .from("theory_questions")
    .select("*, theory_sub_questions(*)")
    .eq("exam_id", attempt.exam_id)
    .order("question_number");

  if (questionsError || !questions) {
    throw new Error("Failed to fetch questions");
  }

  const mappedQuestions: TheoryQuestion[] = questions.map((q: any) => ({
    id: q.id,
    exam_id: q.exam_id,
    question_number: q.question_number,
    main_question: q.main_question,
    marks: q.marks,
    model_answer: q.model_answer,
    key_points: q.key_points,
    rubric: q.rubric,
    sub_questions: q.theory_sub_questions || [],
  }));

  return {
    attempt: attempt as TheoryAttempt,
    exam: exam as TheoryExam,
    questions: mappedQuestions,
  };
}
