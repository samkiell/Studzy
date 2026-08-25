import { db } from "@/lib/db";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { eq, asc } from "drizzle-orm";
import CbtDashboard from "./CbtDashboard";
import type { Course } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CBT Practice",
  description: "Practice past questions and test your knowledge with real-time CBT simulation on Studzy.",
};

export default async function CbtLandingPage() {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.is_cbt, true))
    .orderBy(asc(coursesTable.code));

  return <CbtDashboard courses={(courses as unknown as Course[]) || []} />;
}
