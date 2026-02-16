import { createClient } from "@/lib/supabase/server";
import { AdminRAGTable } from "@/components/admin/AdminRAGTable";
import { BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Manage RAG Knowledge | Admin",
};

export default async function AdminRAGPage() {
  const supabase = await createClient();

  // Fetch unique file paths (resources) from study_material_embeddings
  // We use a raw query or distinct selection to get the list of ingested files
  const { data: embeddings, error } = await supabase
    .from("study_material_embeddings")
    .select("file_path, username, created_at, course_code, level")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching RAG embeddings:", error);
  }

  // Deduplicate by file_path to get a list of "RAG Resources"
  const resourcesMap = new Map();
  (embeddings || []).forEach((emb) => {
    if (!resourcesMap.has(emb.file_path)) {
      resourcesMap.set(emb.file_path, {
        file_path: emb.file_path,
        username: emb.username || "System",
        created_at: emb.created_at,
        course_code: emb.course_code,
        level: emb.level,
        chunk_count: 0,
      });
    }
    resourcesMap.get(emb.file_path).chunk_count++;
  });

  const ragResources = Array.from(resourcesMap.values());

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              RAG Knowledge Base
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Manage semantic embeddings and knowledge sources for Studzy AI
            </p>
          </div>
        </div>
      </div>

      <AdminRAGTable initialResources={ragResources} />
    </div>
  );
}
