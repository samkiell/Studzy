import { createClient } from "@/lib/supabase/server";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { BookOpen } from "lucide-react";
import type { Course } from "@/types/database";

export default async function CoursesPage() {
  const supabase = await createClient();
  
  // Fetch all courses
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("Error fetching courses:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Course Directory
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Browse all available courses and study materials.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-6 dark:bg-primary-900/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              Academic Resources
            </p>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {(courses || []).length} Courses Available
            </h2>
          </div>
        </div>

        <CourseGrid courses={(courses as Course[]) || []} />
      </div>
    </div>
  );
}
