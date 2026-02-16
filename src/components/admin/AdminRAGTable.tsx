"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Trash2, 
  RefreshCw, 
  FileText, 
  User, 
  Calendar,
  Layers,
  ExternalLink,
  BrainCircuit,
  AlertCircle
} from "lucide-react";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface RAGResource {
  file_path: string;
  username: string;
  created_at: string;
  course_code?: string;
  level?: string;
  chunk_count: number;
}

interface AdminRAGTableProps {
  initialResources: RAGResource[];
}

export function AdminRAGTable({ initialResources }: AdminRAGTableProps) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<RAGResource | null>(null);
  const deleteModal = useModal();

  const filteredResources = useMemo(() => {
    return resources.filter((r) =>
      r.file_path.toLowerCase().includes(search.toLowerCase()) ||
      r.username.toLowerCase().includes(search.toLowerCase()) ||
      (r.course_code?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [resources, search]);

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    setLoadingPath(resourceToDelete.file_path);
    deleteModal.close();

    try {
      const response = await fetch("/api/admin/rag/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: resourceToDelete.file_path }),
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r.file_path !== resourceToDelete.file_path));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoadingPath(null);
      setResourceToDelete(null);
    }
  };

  const handleReingest = async (resource: RAGResource) => {
    setLoadingPath(resource.file_path);
    try {
      const response = await fetch("/api/admin/rag/reingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filePath: resource.file_path,
          username: resource.username,
          courseCode: resource.course_code,
          level: resource.level
        }),
      });

      if (response.ok) {
        // Refresh local count or show success
        alert("Re-ingestion triggered successfully");
      }
    } catch (error) {
      console.error("Re-ingest failed:", error);
    } finally {
      setLoadingPath(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search filenames, uploaders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">File Source</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Uploader</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Context</th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">Chunks</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Created</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No knowledge sources found
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => {
                  const isProcessing = loadingPath === resource.file_path;
                  return (
                    <tr 
                      key={resource.file_path}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isProcessing ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[300px]" title={resource.file_path}>
                              {resource.file_path.split('/').pop()}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate max-w-[300px]">
                              {resource.file_path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-neutral-400" />
                          {resource.username}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {resource.course_code ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase dark:bg-blue-900/20 dark:text-blue-400">
                              {resource.course_code}
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">Global</span>
                          )}
                          {resource.level && (
                            <p className="text-[10px] text-neutral-500">Level: {resource.level}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-neutral-900 dark:text-white">
                          <Layers className="h-3 w-3 text-neutral-400" />
                          {resource.chunk_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(resource.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReingest(resource)}
                            disabled={isProcessing}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Re-run AI Ingestion"
                          >
                            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              setResourceToDelete(resource);
                              deleteModal.open();
                            }}
                            disabled={isProcessing}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Embeddings"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Knowledge Sync"
        description="This will permanently delete ALL semantic chunks and embeddings for this file. The AI will no longer be able to reference this content until it is re-ingested."
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={deleteModal.close}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent font-bold"
            >
              Confirm Wipe
            </Button>
          </div>
        }
      />
    </div>
  );
}
