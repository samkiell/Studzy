import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { theoryExams, theoryAttempts } from "@/lib/db/schema/theory";
import { eq, desc, inArray, asc } from "drizzle-orm";
import TheoryDashboard from "./TheoryDashboard";
import type { Course } from "@/types/database";

export const metadata = {
  title: "Theory Exams | Studzy",
  description: "Practice written theory exams with AI-powered grading",
};

export default async function TheoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch courses with exam_type = 'theory'
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.exam_type, "theory"))
    .orderBy(asc(coursesTable.code));

  // Fetch all theory exams grouped by course
  const courseIds = courses.map((c) => c.id);

  let exams: any[] = [];
  if (courseIds.length > 0) {
    exams = await db
      .select()
      .from(theoryExams)
      .where(inArray(theoryExams.course_id, courseIds))
      .orderBy(desc(theoryExams.created_at));
  }

  // Fetch user's recent attempts
  const recentAttempts = await db
    .select()
    .from(theoryAttempts)
    .where(eq(theoryAttempts.user_id, user.id))
    .orderBy(desc(theoryAttempts.started_at))
    .limit(10);

  return (
    <TheoryDashboard
      courses={(courses as unknown as Course[]) || []}
      exams={exams || []}
      recentAttempts={(recentAttempts as any) || []}
    />
  );
}
