import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { attempts, questions as questionsTable } from "@/lib/db/schema/cbt";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { eq, inArray } from "drizzle-orm";
import CbtInterface from "@/components/cbt/CbtInterface";
import { Question, Attempt } from "@/types/cbt";
import { shuffle } from "@/lib/utils";

interface CbtAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function CbtAttemptPage({ params }: CbtAttemptPageProps) {
  const { attemptId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch the attempt record
  const [attemptData] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);

  if (!attemptData) {
    notFound();
  }

  // 2. Fetch the course title
  let course: { title: string; code: string } | undefined = undefined;
  if (attemptData.course_id) {
    const [fetchedCourse] = await db
      .select({
        title: coursesTable.title,
        code: coursesTable.code,
      })
      .from(coursesTable)
      .where(eq(coursesTable.id, attemptData.course_id))
      .limit(1);
    course = fetchedCourse;
  }

  const attempt: Attempt = {
    ...attemptData,
    created_at: attemptData.started_at ? new Date(attemptData.started_at).toISOString() : "",
    completed_at: attemptData.completed_at ? new Date(attemptData.completed_at).toISOString() : null,
    started_at: attemptData.started_at ? new Date(attemptData.started_at).toISOString() : "",
    course_title: course?.title || "Unknown Course",
    course_code: course?.code || "CBT",
    question_ids: (attemptData.question_ids as string[]) || [],
  } as unknown as Attempt;

  // 3. Fetch questions
  let questions: Question[] = [];
  const qIds = attempt.question_ids || [];

  if (qIds.length > 0) {
    const fetchedQuestions = await db
      .select()
      .from(questionsTable)
      .where(inArray(questionsTable.id, qIds));

    questions = qIds
      .map((id) => fetchedQuestions.find((q) => q.id === id))
      .filter((q): q is any => !!q);
  } else if (attemptData.course_id) {
    const allQuestions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.course_id, attemptData.course_id));

    questions = shuffle(allQuestions as unknown as Question[]).slice(0, attempt.total_questions);
  }

  return (
    <CbtInterface 
      initialAttempt={attempt} 
      questions={questions as Question[]} 
    />
  );
}
