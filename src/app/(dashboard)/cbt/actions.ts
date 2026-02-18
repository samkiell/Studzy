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
  topic,
  difficulty,
  isWeakAreasOnly = false,
}: {
  courseId: string;
  mode: CbtMode;
  numberOfQuestions: number;
  topic?: string;
  difficulty?: Difficulty;
  isWeakAreasOnly?: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 0. Validate Course
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

  // 1. Determine which topics to study if "Weak Areas Only" is enabled
  let targetTopics = topic ? [topic] : [];
  
  if (isWeakAreasOnly) {
    // Fetch average accuracy per topic for this user and course
    const { data: stats } = await supabase.rpc('get_user_topic_accuracy', {
      p_user_id: user.id,
      p_course_id: courseId
    });
    
    // Filter topics where accuracy < 60%
    if (stats) {
      const weakTopics = (stats as any[])
        .filter(s => s.accuracy < 60)
        .map(s => s.topic);
      
      if (weakTopics.length > 0) {
        targetTopics = weakTopics;
      }
    }
  }

  // 2. Fetch questions with filters
  let query = supabase
    .from("questions")
    .select("id")
    .eq("course_id", courseId);

  if (targetTopics.length > 0) {
    query = query.in("topic", targetTopics);
  }
  
  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  const { data: questionIds, error: questError } = await query;

  if (questError) {
    console.error("Error fetching filtered questions:", questError);
    throw new Error("Failed to fetch questions");
  }

  if (!questionIds || questionIds.length === 0) {
    throw new Error("No questions found matching your filters");
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
    throw new Error("Failed to fetch question details");
  }

  // 3. Create attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      course_id: courseId,
      course_code: course.code,
      mode,
      total_questions: questions.length,
      score: 0,
      duration_seconds: 0,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    console.error("Failed to create attempt. Error:", attemptError);
    throw new Error("Failed to create attempt");
  }

  return {
    attempt: { ...attempt, course_title: course.title } as Attempt,
    questions: questions as Question[],
  };
}

export async function getCbtMetadata(courseId: string) {
  const supabase = await createClient();
  
  // Get unique topics and question counts per topic
  const { data: topicsData, error } = await supabase
    .from("questions")
    .select("topic")
    .eq("course_id", courseId);
    
  if (error) return { topics: [], totalQuestions: 0 };
  
  const topicCounts: Record<string, number> = {};
  topicsData.forEach(q => {
    const t = q.topic || "General";
    topicCounts[t] = (topicCounts[t] || 0) + 1;
  });
  
  const topics = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    count
  }));
  
  return {
    topics,
    totalQuestions: topicsData.length
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
