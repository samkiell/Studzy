import { db } from "@/lib/db";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { eq, asc } from "drizzle-orm";
import CbtDashboard from "./CbtDashboard";
import type { Course } from "@/types/database";

export default async function CbtLandingPage() {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.is_cbt, true))
    .orderBy(asc(coursesTable.code));

  return <CbtDashboard courses={(courses as unknown as Course[]) || []} />;
}
