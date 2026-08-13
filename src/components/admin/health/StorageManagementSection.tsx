"use client";

import React, { useState, useMemo } from "react";
import { StorageFileDetail, StorageHealthMetrics } from "@/lib/supabase/health/types";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileCode, 
  FolderArchive,
  RefreshCw,
  CheckSquare,
  Square,
  BookOpen,
  Eye,
  Sparkles
} from "lucide-react";

interface StorageManagementSectionProps {
  initialMetrics: StorageHealthMetrics;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 2 : 0)} ${sizes[i]}`;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video: { label: "Video", icon: Video, color: "text-red-500" },
  audio: { label: "Audio", icon: Music, color: "text-purple-500" },
  pdf: { label: "PDF", icon: FileText, color: "text-amber-500" },
  image: { label: "Image", icon: ImageIcon, color: "text-blue-500" },
  document: { label: "Document", icon: FileCode, color: "text-emerald-500" },
  other: { label: "Other", icon: FolderArchive, color: "text-neutral-500" },
};

export function StorageManagementSection({ initialMetrics }: StorageManagementSectionProps) {
  const [metrics, setMetrics] = useState<StorageHealthMetrics>(initialMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"size-desc" | "size-asc" | "date-desc" | "date-asc" | "name-asc">("size-desc");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  const [modalOpen, setModalOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<StorageFileDetail[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const files = metrics.allFiles || [];

  // Filter & Sort Logic
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // Bucket filter
      if (bucketFilter !== "all" && f.bucket !== bucketFilter) return false;
      // Type filter
      if (typeFilter !== "all" && f.fileType !== typeFilter) return false;
      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const pathMatch = f.path.toLowerCase().includes(q);
        const resMatch = f.linkedResource?.title.toLowerCase().includes(q);
        const courseMatch = f.linkedResource?.courseCode.toLowerCase().includes(q);
        if (!nameMatch && !pathMatch && !resMatch && !courseMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case "size-desc": return b.sizeBytes - a.sizeBytes;
        case "size-asc": return a.sizeBytes - b.sizeBytes;
        case "date-desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [files, bucketFilter, typeFilter, searchQuery, sortBy]);

  // Total filtered size
  const filteredSizeBytes = useMemo(() => {
    return filteredFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  }, [filteredFiles]);

  // Selected files size
  const selectedFiles = useMemo(() => {
    return files.filter((f) => selectedPaths.has(`${f.bucket}::${f.path}`));
  }, [files, selectedPaths]);

  const selectedSizeBytes = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  }, [selectedFiles]);

  // Checkbox Selection
  const toggleSelectFile = (fileKey: string) => {
    const next = new Set(selectedPaths);
    if (next.has(fileKey)) {
      next.delete(fileKey);
    } else {
      next.add(fileKey);
    }
    setSelectedPaths(next);
  };

  const toggleSelectAllFiltered = () => {
    if (selectedPaths.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedPaths(new Set());
    } else {
      const next = new Set<string>();
      filteredFiles.forEach((f) => next.add(`${f.bucket}::${f.path}`));
      setSelectedPaths(next);
    }
  };

  // Open Deletion Modal
  const openSingleDelete = (file: StorageFileDetail) => {
    setFilesToDelete([file]);
    setModalOpen(true);
  };

  const openBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    setFilesToDelete(selectedFiles);
    setModalOpen(true);
  };

  // Execute Deletion
  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    setStatusMessage(null);

    // Group files by bucket
    const bucketGroups: Record<string, string[]> = {};
    for (const f of filesToDelete) {
      if (!bucketGroups[f.bucket]) bucketGroups[f.bucket] = [];
      bucketGroups[f.bucket].push(f.path);
    }

    let totalDeleted = 0;
    let hasError = false;
    let errorMsg = "";

    for (const [bId, paths] of Object.entries(bucketGroups)) {
      try {
        const res = await fetch("/api/admin/storage-management/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket: bId, paths }),
        });
        const data = await res.json();
        if (data.success) {
          totalDeleted += data.deletedCount || paths.length;
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        } else {
          hasError = true;
          errorMsg = data.message || "Deletion failed";
        }
      } catch (err) {
        hasError = true;
        errorMsg = err instanceof Error ? err.message : "Deletion error";
      }
    }

    setIsDeleting(false);
    setModalOpen(false);
    setSelectedPaths(new Set());

    if (hasError) {
      setStatusMessage({ type: "error", text: errorMsg });
    } else {
      setStatusMessage({
        type: "success",
        text: `Successfully deleted ${totalDeleted} object(s). Storage metrics revalidated.`,
      });
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Storage Control Panel & Cleanup</span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {files.length} Objects
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Inspect, map to course resources, and delete storage files directly from Studzy
          </p>
        </div>

        {statusMessage && (
          <div
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              statusMessage.type === "success"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Controls: Search, Filters & Sorting */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files or course titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-xs text-neutral-900 outline-none focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        {/* Bucket Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
          <select
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 outline-none focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
          >
            <option value="all">All Buckets</option>
            {metrics.buckets.map((b) => (
              <option key={b.bucketId} value={b.bucketId}>
                {b.bucketName} ({formatBytes(b.sizeBytes)})
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 outline-none focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
          >
            <option value="all">All Resource Types</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDFs</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-neutral-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 outline-none focus:border-primary-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
          >
            <option value="size-desc">Size: Largest First</option>
            <option value="size-asc">Size: Smallest First</option>
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="name-asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      {/* Batch Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
        <div className="flex items-center gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          <button
            onClick={toggleSelectAllFiltered}
            className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {selectedPaths.size === filteredFiles.length && filteredFiles.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-primary-600" />
            ) : (
              <Square className="h-4 w-4 text-neutral-400" />
            )}
            <span>
              {selectedPaths.size > 0 ? `Selected (${selectedPaths.size})` : "Select All Filtered"}
            </span>
          </button>

          <span>
            Filtered Total: <strong className="font-bold text-neutral-900 dark:text-white">{filteredFiles.length} files</strong> ({formatBytes(filteredSizeBytes)})
          </span>
        </div>

        {selectedPaths.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-red-600 dark:text-red-400">
              To be freed: {formatBytes(selectedSizeBytes)}
            </span>
            <button
              onClick={openBulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-red-700 active:scale-95 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedPaths.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Files Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 dark:bg-neutral-800/60 dark:border-neutral-800 font-semibold uppercase">
            <tr>
              <th className="py-3 px-3 w-10 text-center">Select</th>
              <th className="py-3 px-3">File / Object Path</th>
              <th className="py-3 px-3">Bucket</th>
              <th className="py-3 px-3">Application Resource Mapping</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Size</th>
              <th className="py-3 px-3">Created</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                  No storage objects matched your search/filter criteria.
                </td>
              </tr>
            ) : (
              filteredFiles.map((file, idx) => {
                const key = `${file.bucket}::${file.path}`;
                const isSelected = selectedPaths.has(key);
                const cfg = CATEGORY_CONFIG[file.fileType] || CATEGORY_CONFIG.other;
                const Icon = cfg.icon;

                return (
                  <tr
                    key={`${key}-${idx}`}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-red-50/40 dark:bg-red-950/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFile(key)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-900 dark:text-white max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                        <div className="truncate">
                          <span className="font-semibold block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 truncate block" title={file.path}>
                            {file.path}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                        {file.bucket}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      {file.linkedResource ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-semibold truncate">
                            <BookOpen className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                            <span className="truncate" title={file.linkedResource.title}>
                              {file.linkedResource.courseCode ? `${file.linkedResource.courseCode} - ` : ""}
                              {file.linkedResource.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            {file.resourceAppUrl && (
                              <a
                                href={file.resourceAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-primary-600 hover:underline dark:text-primary-400"
                              >
                                <span>View Resource Page</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {file.courseAppUrl && (
                              <a
                                href={file.courseAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-neutral-500 hover:underline dark:text-neutral-400"
                              >
                                <span>Course</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Unlinked storage file</span>
                      )}
                    </td>
                    <td className="py-3 px-3 uppercase font-semibold text-neutral-500 text-[10px] whitespace-nowrap">
                      {file.fileType}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap text-[11px]">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {file.publicUrl && (
                          <a
                            href={file.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                            title="Direct Public Storage URL"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => openSingleDelete(file)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                          title="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Deletion Modal */}
      <DeleteConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleExecuteDelete}
        filesToDelete={filesToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
