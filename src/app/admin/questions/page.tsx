import { AdminQuestionBankTable } from "@/components/admin/AdminQuestionBankTable";
import { AdminQuestionsTable } from "@/components/admin/AdminQuestionsTable";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema/courses";
import { questions as questionsTable } from "@/lib/db/schema/cbt";
import { eq, desc } from "drizzle-orm";
import { Database, FileJson } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Questions | Admin",
};

export default async function AdminQuestionsPage() {
  await requireAdmin();

  // 1. Fetch question_bank resources (uploaded JSON files)
  const bankResources = await db
    .select({
      id: resources.id,
      title: resources.title,
      file_url: resources.file_url,
      created_at: resources.created_at,
      course_id: resources.course_id,
      course_code: courses.code,
    })
    .from(resources)
    .leftJoin(courses, eq(resources.course_id, courses.id))
    .where(eq(resources.type, "question_bank"))
    .orderBy(desc(resources.created_at));

  // 2. Fetch ALL individual questions from the questions table
  const questionsData = await db
    .select()
    .from(questionsTable)
    .orderBy(desc(questionsTable.created_at));

  const questions = (questionsData || []).map((q) => ({
    id: q.id,
    course_code: q.course_code || "Unknown",
    question_id: q.question_id,
    question_text: q.question_text || "",
    options: (q.options as Record<string, string>) || {},
    correct_option: q.correct_option,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    question_type: q.question_type,
    created_at: q.created_at ? new Date(q.created_at).toISOString() : "",
  }));

  // Count questions per uploaded bank
  const countByBank = new Map<string, number>();
  for (const q of questionsData || []) {
    const bankId = q.bank_id;
    if (bankId) countByBank.set(bankId, (countByBank.get(bankId) || 0) + 1);
  }

  const files = (bankResources || []).map((r) => ({
    id: r.id,
    title: r.title,
    course_code: r.course_code || "Unknown",
    file_url: r.file_url,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    questionCount: countByBank.get(r.id) || 0,
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
        <AdminQuestionsTable questions={questions as any} />
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
        <AdminQuestionBankTable files={files as any} />
      </div>
    </div>
  );
}
