import { createClient } from "@/lib/supabase/server";
import { AdminQuestionBankTable } from "@/components/admin/AdminQuestionBankTable";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Database } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Questions | Admin",
};

export default async function AdminQuestionsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch question_bank resources
  const { data: resources, error } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      file_url,
      created_at,
      course_id,
      courses (
        code
      )
    `)
    .eq("type", "question_bank")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching question banks:", error);
  }

  // Format data for the table
  // The query returns course as an object, we need to flatten it or handle it in the map
  const files = (resources || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    course_code: r.courses?.code || "Unknown",
    file_url: r.file_url,
    created_at: r.created_at,
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
              Question Banks
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Manage uploaded CBT Question Bank files.
            </p>
          </div>
        </div>
      </div>

      <AdminQuestionBankTable files={files} />
    </div>
  );
}
