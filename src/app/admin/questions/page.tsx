import { AdminQuestionBankTable } from "@/components/admin/AdminQuestionBankTable";
import { AdminQuestionsTable } from "@/components/admin/AdminQuestionsTable";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Database, FileJson } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Questions | Admin",
};

export default async function AdminQuestionsPage() {
  await requireAdmin();

  // Use admin client to bypass RLS and see ALL questions
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // 1. Fetch question_bank resources (uploaded JSON files)
  const { data: resources, error: resourcesError } = await supabase
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

  if (resourcesError) {
    console.error("Error fetching question banks:", resourcesError);
  }

  const files = (resources || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    course_code: r.courses?.code || "Unknown",
    file_url: r.file_url,
    created_at: r.created_at,
  }));

  // 2. Fetch ALL individual questions from the questions table
  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select("id, course_code, question_id, question_text, options, correct_option, explanation, topic, difficulty, question_type, created_at")
    .order("created_at", { ascending: false });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
  }

  const questions = (questionsData || []).map((q: any) => ({
    id: q.id,
    course_code: q.course_code || "Unknown",
    question_id: q.question_id,
    question_text: q.question_text || "",
    options: q.options || {},
    correct_option: q.correct_option,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    question_type: q.question_type,
    created_at: q.created_at,
  }));

  return (
    <div className="space-y-12">
      {/* Individual Questions Section */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              All Questions
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {questions.length} questions across all courses
            </p>
          </div>
        </div>
        <AdminQuestionsTable questions={questions} />
      </div>

      {/* Question Bank Files Section */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <FileJson className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white md:text-2xl">
              Uploaded Question Banks
            </h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {files.length} JSON files uploaded
            </p>
          </div>
        </div>
        <AdminQuestionBankTable files={files} />
      </div>
    </div>
  );
}
