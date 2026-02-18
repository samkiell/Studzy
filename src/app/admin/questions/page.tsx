import { createClient } from "@/lib/supabase/server";
import { AdminQuestionTable } from "@/components/admin/AdminQuestionTable";
import { Database } from "lucide-react";

export const metadata = {
  title: "Manage Questions | Admin",
};

export default async function AdminQuestionsPage() {
  const supabase = await createClient();

  // Fetch all questions with course codes
  const { data: questions, error } = await supabase
    .from("questions")
    .select(`
      *,
      courses (
        code
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500); // Limit to recent 500 for performance

  if (error) {
    console.error("Error fetching questions:", error);
  }

  // Transform data to flatten course code
  const formattedQuestions = (questions || []).map((q: any) => ({
    ...q,
    course_id: q.courses?.code || q.course_id // Replace UUID with Code if available for display
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              Manage Questions
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              View and manage uploaded CBT questions
            </p>
          </div>
        </div>
      </div>

      <AdminQuestionTable questions={formattedQuestions} />
    </div>
  );
}
