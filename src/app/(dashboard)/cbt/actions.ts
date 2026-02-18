"use server";

import { createClient } from "@/lib/supabase/server";
import { Attempt, CbtMode, Question, SubmitAnswer } from "@/types/cbt";
import { revalidatePath } from "next/cache";

/**
 * Starts a new CBT attempt.
 * Randomly selects N questions and creates a record in the 'attempts' table.
 */
/**
 * Starts a new CBT attempt.
 * Randomly selects N questions and creates a record in the 'attempts' table.
 */
export async function startCbtAttempt({
  courseId,
  mode,
  numberOfQuestions,
}: {
  courseId: string;
  mode: CbtMode;
  numberOfQuestions: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 0. Validate Course and get Title & Code (legacy support)
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("title, code, is_cbt")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    throw new Error("Course not found");
  }

  if (!course.is_cbt) {
    throw new Error("This course is not enabled for CBT");
  }

  // 1. Fetch random questions using course_id
  const { data: questionIds, error: questError } = await supabase
    .from("questions")
    .select("id")
    .eq("course_id", courseId);

  if (questError) {
    console.error("Error fetching questions:", questError);
    throw new Error("Failed to fetch questions");
  }

  if (!questionIds || questionIds.length === 0) {
    throw new Error("No questions found for this course");
  }

  const shuffledIds = [...questionIds]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(numberOfQuestions, questionIds.length))
    .map((q) => q.id);

  const { data: questions, error: fetchError } = await supabase
    .from("questions")
    .select("*")
    .in("id", shuffledIds);

  if (fetchError || !questions) {
    console.error("Error fetching full questions:", fetchError);
    throw new Error("Failed to fetch questions");
  }

  // 2. Create attempt record with course_id and course_code (legacy)
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      course_id: courseId,
      course_code: course.code, // Required by DB constraint
      mode,
      total_questions: questions.length,
      score: 0,
      duration_seconds: 0,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    console.error("Error creating attempt:", attemptError);
    throw new Error("Failed to create attempt");
  }

  // Hydrate attempt with course title for UI
  const hydratedAttempt: Attempt = {
    ...attempt,
    course_title: course.title
  } as Attempt;

  return {
    attempt: hydratedAttempt,
    questions: questions as Question[],
  };
}

/**
 * Submits a CBT attempt.
 * Validates answers server-side, calculates the score, and updates the database.
 */
export async function submitCbtAttempt({
  attemptId,
  answers,
  durationSeconds,
}: {
  attemptId: string;
  answers: SubmitAnswer[];
  durationSeconds: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch the attempt to verify ownership and avoid double submission
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.completed_at) {
    throw new Error("Attempt already completed");
  }

  // 2. Fetch correct answers for the questions in this attempt
  const questionIds = answers.map((a) => a.question_id);
  const { data: questions, error: questError } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_option, topic, difficulty, explanation")
    .in("id", questionIds);

  if (questError || !questions) {
    throw new Error("Failed to validate answers");
  }

  // 3. Calculate score and prepare analytics
  let score = 0;
  const topicStats: Record<string, { correct: number; total: number; avgTime: number }> = {};
  const difficultyStats: Record<string, { correct: number; total: number }> = {};
  const questionsWithAnswers: any[] = [];

  const attemptAnswersPayload = answers.map((ans) => {
    const question = questions.find((q) => q.id === ans.question_id);
    const isCorrect = question?.correct_option === ans.selected_option;
    if (isCorrect) score++;

    if (question) {
      const topic = question.topic || "General";
      const difficulty = question.difficulty || "medium";

      // Topic stats
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, avgTime: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;
      topicStats[topic].avgTime += ans.duration_seconds;

      // Difficulty stats
      if (!difficultyStats[difficulty]) difficultyStats[difficulty] = { correct: 0, total: 0 };
      difficultyStats[difficulty].total++;
      if (isCorrect) difficultyStats[difficulty].correct++;

      questionsWithAnswers.push({
        ...question,
        selected_option: ans.selected_option,
        is_correct: isCorrect,
        duration_seconds: ans.duration_seconds
      });
    }

    return {
      attempt_id: attemptId,
      question_id: ans.question_id,
      selected_option: ans.selected_option,
      is_correct: isCorrect,
      duration_seconds: ans.duration_seconds
    };
  });

  // Finalize topic average times
  Object.keys(topicStats).forEach(topic => {
    topicStats[topic].avgTime = Math.round(topicStats[topic].avgTime / topicStats[topic].total);
  });

  // 4. Update attempt record
  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      score,
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (updateError) {
    console.error("Error updating attempt:", updateError);
    throw new Error("Failed to update attempt score");
  }

  // 5. Insert individual answers
  const { error: answersError } = await supabase
    .from("attempt_answers")
    .insert(attemptAnswersPayload);

  if (answersError) {
    console.error("Error inserting attempt answers:", answersError);
  }

  revalidatePath("/dashboard/cbt");
  revalidatePath(`/cbt/${attemptId}`);

  return {
    score,
    totalQuestions: attempt.total_questions,
    completedAt: new Date().toISOString(),
    topicStats,
    difficultyStats,
    questionsWithAnswers
  };
}
