import { db } from "@/lib/db";
import { courses as coursesTable } from "@/lib/db/schema/courses";
import { asc } from "drizzle-orm";
import { AdminCourseTable } from "@/components/admin/AdminCourseTable";
import { BookOpen } from "lucide-react";
import type { Course } from "@/types/database";

export const metadata = {
  title: "Manage Courses | Admin",
};

export default async function AdminCoursesPage() {
  const courses = await db
    .select()
    .from(coursesTable)
    .orderBy(asc(coursesTable.code));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              Manage Courses
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Create, edit, or remove academic courses
            </p>
          </div>
        </div>
      </div>

      <AdminCourseTable courses={(courses as unknown as Course[]) || []} />
    </div>
  );
}
