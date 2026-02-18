import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminQuestionBankTable } from "@/components/admin/AdminQuestionBankTable";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

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
