import { createClient } from "@/lib/supabase/server";
import { AdminRAGTable } from "@/components/admin/AdminRAGTable";
import { BrainCircuit } from "lucide-react";

export const metadata = {
  title: "Manage RAG Knowledge | Admin",
};

export default async function AdminRAGPage() {
  const supabase = await createClient();

  // 1. Fetch ALL files from the RAG storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from("RAG")
    .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

  if (storageError) {
    console.error("Error listing RAG storage:", storageError);
  }

  // 2. Fetch unique file paths (resources) from study_material_embeddings
  const { data: embeddings, error } = await supabase
    .from("study_material_embeddings")
    .select("file_path, username, created_at, course_code, level")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching RAG embeddings:", error);
  }

  // 3. Extract actually ingested resources from embeddings
  const ingestedMap = new Map();
  (embeddings || []).forEach((emb) => {
    if (!ingestedMap.has(emb.file_path)) {
      ingestedMap.set(emb.file_path, {
        file_path: emb.file_path,
        username: emb.username || "System",
        created_at: emb.created_at,
        course_code: emb.course_code,
        level: emb.level,
        chunk_count: 0,
        status: "synced" as const,
      });
    }
    ingestedMap.get(emb.file_path).chunk_count++;
  });

  // 4. Incorporate files found in storage that MIGHT NOT be ingested yet
  // We need to handle folders (like 'pdf/', 'document/')
  const allResources: any[] = [];
  
  // Recursively listing folders in Supabase is tricky with just .list(), 
  // but we usually store them in type/filename.
  // Let's at least check the main ones we expect.
  
  // Actually, to keep it simple and fix the user's issue, 
  // let's just make sure we check common paths.
  // Better yet: Just use the embeddings map as source of truth for "Knowledge", 
  // but if we want to show "Pending" files, we'd need to track them.
  
  // Wait, if the user uploaded it, it's in the 'resources' table too IF it was a course upload.
  // If it was a RAG dump, it's ONLY in storage.
  
  // Let's stick to the current list but add a "Refresh" button or similar.
  // No, the user says "uploaded it but can't find it".
  
  // If I list the bucket, I can see what's there.
  // Folder structure: 'document/', 'pdf/', 'audio/', 'video/', 'image/'
  const folders = ["document", "pdf"];
  const bucketResources: any[] = [];

  for (const folder of folders) {
    const { data: files } = await supabase.storage.from("RAG").list(folder, { limit: 100 });
    (files || []).forEach(file => {
      if (file.name === ".emptyFolderPlaceholder") return;
      const fullPath = `${folder}/${file.name}`;
      if (!ingestedMap.has(fullPath)) {
        bucketResources.push({
          file_path: fullPath,
          username: "Pending...",
          created_at: file.created_at,
          chunk_count: 0,
          status: "pending"
        });
      }
    });
  }

  const ragResources = [...Array.from(ingestedMap.values()), ...bucketResources].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
