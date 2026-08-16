"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { questions as questionsTable, attempts, attemptAnswers } from "@/lib/db/schema/cbt";
import { eq, and, inArray } from "drizzle-orm";
import { Attempt, CbtMode, Question, SubmitAnswer } from "@/types/cbt";
import { revalidatePath } from "next/cache";

export async function startCbtAttempt({
  courseId,
  mode,
  numberOfQuestions,
  topic,
  timeLimitMinutes = 30,
  isWeakAreasOnly = false,
  difficulty,
}: {
  courseId: string;
  mode: CbtMode;
  numberOfQuestions: number;
  topic?: string;
  timeLimitMinutes?: number;
  isWeakAreasOnly?: boolean;
  difficulty?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 0. Validate Course
  const [course] = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      code: coursesTable.code,
      is_cbt: coursesTable.is_cbt,
    })
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (!course.is_cbt) {
    throw new Error("This course is not enabled for CBT");
  }

  // 1. Fetch questions with filters
  const conditions = [eq(questionsTable.course_id, courseId)];

  if (topic && topic !== "all") {
    conditions.push(eq(questionsTable.topic, topic));
  }

  if (difficulty && difficulty !== "all") {
    conditions.push(eq(questionsTable.difficulty, difficulty));
  }

  const allQuestions = await db
    .select()
    .from(questionsTable)
    .where(and(...conditions));

  if (!allQuestions || allQuestions.length === 0) {
    throw new Error("No questions found matching your filters");
  }

  const shuffledQuestions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(numberOfQuestions, allQuestions.length));

  const shuffledIds = shuffledQuestions.map((q) => q.id);

  // 2. Create attempt record
  const [attempt] = await db
    .insert(attempts)
    .values({
      user_id: user.id,
      course_id: courseId,
      course_code: course.code,
      mode,
      total_questions: shuffledQuestions.length,
      score: 0,
      duration_seconds: 0,
      time_limit_seconds: timeLimitMinutes * 60,
      question_ids: shuffledIds,
    })
    .returning();

  return {
    attempt: { ...attempt, course_title: course.title } as unknown as Attempt,
    questions: shuffledQuestions as unknown as Question[],
  };
}

export async function getCbtMetadata(courseId: string) {
  const topicsData = await db
    .select({
      topic: questionsTable.topic,
      question_type: questionsTable.question_type,
      difficulty: questionsTable.difficulty,
    })
    .from(questionsTable)
    .where(eq(questionsTable.course_id, courseId));

  const topicCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  let hasTheoryQuestions = false;

  topicsData.forEach((q) => {
    const t = q.topic || "General";
    topicCounts[t] = (topicCounts[t] || 0) + 1;
    if (q.question_type === "theory") hasTheoryQuestions = true;
    const d = q.difficulty || "medium";
    difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
  });

  const topics = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const difficulties = Object.entries(difficultyCounts).map(([name, count]) => ({
    name,
    count,
  }));

  return {
    topics,
    totalQuestions: topicsData.length,
    hasTheoryQuestions,
    difficulties,
  };
}

export async function submitCbtAttempt({
  attemptId,
  answers,
  durationSeconds,
  theoryAnswers,
  questionDurations,
}: {
  attemptId: string;
  answers: SubmitAnswer[];
  durationSeconds: number;
  theoryAnswers?: Record<string, { main?: string; sub: Record<string, string> }>;
  questionDurations?: Record<string, number>;
}) {
  const { scoreQuiz } = await import("@/lib/cbt/quizScorer");

  const submittedAnswers: any[] = [];

  for (const ans of answers) {
    submittedAnswers.push({
      question_id: ans.question_id,
      selected_option: ans.selected_option,
      theory_answer: null,
      theory_sub_answers: null,
      duration_seconds: ans.duration_seconds,
    });
  }

  if (theoryAnswers) {
    for (const [questionId, answer] of Object.entries(theoryAnswers)) {
      if (submittedAnswers.find((a) => a.question_id === questionId)) continue;
      submittedAnswers.push({
        question_id: questionId,
        selected_option: null,
        theory_answer: answer.main || null,
        theory_sub_answers: Object.keys(answer.sub).length > 0 ? answer.sub : null,
        duration_seconds: questionDurations?.[questionId] || 0,
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

export async function syncOfflineAttempt(offlineAttempt: {
  course_id: string;
  mode: CbtMode;
  total_questions: number;
  score: number;
  duration_seconds: number;
  time_limit_seconds: number | null;
  question_ids: string[];
  answers: Record<string, string>;
  theoryAnswers?: Record<string, { main?: string; sub: Record<string, string> }>;
  questionDurations: Record<string, number>;
  started_at: string;
  completed_at: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Create a server-side attempt record
  const [attempt] = await db
    .insert(attempts)
    .values({
      user_id: user.id,
      course_id: offlineAttempt.course_id,
      mode: offlineAttempt.mode,
      total_questions: offlineAttempt.total_questions,
      score: offlineAttempt.score,
      duration_seconds: offlineAttempt.duration_seconds,
      time_limit_seconds: offlineAttempt.time_limit_seconds,
      question_ids: offlineAttempt.question_ids,
      started_at: new Date(offlineAttempt.started_at),
      completed_at: new Date(offlineAttempt.completed_at),
    })
    .returning();

  // 2. Insert all student answers
  const submittedAnswers: any[] = [];

  const qIds = Object.keys(offlineAttempt.answers);
  const fetchedQuestions = qIds.length > 0
    ? await db.select().from(questionsTable).where(inArray(questionsTable.id, qIds))
    : [];

  for (const [qId, option] of Object.entries(offlineAttempt.answers)) {
    const qData = fetchedQuestions.find((q) => q.id === qId);
    const isCorrect = qData?.correct_option === option;

    submittedAnswers.push({
      attempt_id: attempt.id,
      question_id: qId,
      selected_option: option,
      theory_answer: null,
      is_correct: isCorrect,
    });
  }

  if (submittedAnswers.length > 0) {
    await db.insert(attemptAnswers).values(submittedAnswers);
  }

  revalidatePath("/dashboard/cbt");
  return { success: true, serverAttemptId: attempt.id };
}
