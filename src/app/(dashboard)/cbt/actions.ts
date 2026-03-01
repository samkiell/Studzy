"use server";

import { createClient } from "@/lib/supabase/server";
import { Attempt, CbtMode, Difficulty, Question, SubmitAnswer } from "@/types/cbt";
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
  timeLimitMinutes = 30,
  isWeakAreasOnly = false,
}: {
  courseId: string;
  mode: CbtMode;
  numberOfQuestions: number;
  topic?: string;
  timeLimitMinutes?: number;
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
    // If 'General' is in targetTopics, we also want to include questions where topic is null
    if (targetTopics.includes("General")) {
      query = query.or(`topic.in.(${targetTopics.map(t => `"${t}"`).join(",")}),topic.is.null`);
    } else {
      query = query.in("topic", targetTopics);
    }
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
      time_limit_seconds: timeLimitMinutes * 60,
      question_ids: shuffledIds,
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
  
  // Get unique topics, question counts, and detect theory questions
  const { data: topicsData, error } = await supabase
    .from("questions")
    .select("topic, question_type")
    .eq("course_id", courseId);
    
  if (error) return { topics: [], totalQuestions: 0, hasTheoryQuestions: false };
  
  const topicCounts: Record<string, number> = {};
  let hasTheoryQuestions = false;
  topicsData.forEach(q => {
    const t = q.topic || "General";
    topicCounts[t] = (topicCounts[t] || 0) + 1;
    if (q.question_type === "theory") hasTheoryQuestions = true;
  });
  
  const topics = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    count
  }));
  
  return {
    topics,
    totalQuestions: topicsData.length,
    hasTheoryQuestions
  };
}

/**
 * Submits a CBT attempt.
 * Handles both MCQ and theory questions via the modular quiz scorer.
 * MCQs are scored deterministically; theory questions are graded by AI.
 */
export async function submitCbtAttempt({
  attemptId,
  answers,
  durationSeconds,
  theoryAnswers,
}: {
  attemptId: string;
  answers: SubmitAnswer[];
  durationSeconds: number;
  theoryAnswers?: Record<string, { main?: string; sub: Record<string, string> }>;
}) {
  const { scoreQuiz } = await import("@/lib/cbt/quizScorer");

  // Merge MCQ answers and theory answers into the unified format
  const submittedAnswers: any[] = [];

  // MCQ answers
  for (const ans of answers) {
    submittedAnswers.push({
      question_id: ans.question_id,
      selected_option: ans.selected_option,
      theory_answer: null,
      theory_sub_answers: null,
      duration_seconds: ans.duration_seconds,
    });
  }

  // Theory answers
  if (theoryAnswers) {
    for (const [questionId, answer] of Object.entries(theoryAnswers)) {
      // Don't duplicate if already in MCQ answers
      if (submittedAnswers.find(a => a.question_id === questionId)) continue;
      submittedAnswers.push({
        question_id: questionId,
        selected_option: null,
        theory_answer: answer.main || null,
        theory_sub_answers: Object.keys(answer.sub).length > 0 ? answer.sub : null,
        duration_seconds: 0,
      });
    }
  }

  const result = await scoreQuiz({
    attemptId,
    answers: submittedAnswers,
    durationSeconds,
  });

  revalidatePath("/dashboard/cbt");
  revalidatePath(`/cbt/${attemptId}`);

  return result;
}

