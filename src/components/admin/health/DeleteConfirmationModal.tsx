"use client";

import React from "react";
import { StorageFileDetail } from "@/lib/supabase/health/types";
import { AlertTriangle, Trash2, Loader2, X, FileText, ExternalLink } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  filesToDelete: StorageFileDetail[];
  isDeleting: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 2 : 0)} ${sizes[i]}`;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  filesToDelete,
  isDeleting,
}: DeleteConfirmationModalProps) {
  if (!isOpen || filesToDelete.length === 0) return null;

  const totalFreedBytes = filesToDelete.reduce((acc, f) => acc + f.sizeBytes, 0);
  const linkedResources = filesToDelete.filter((f) => f.linkedResource);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Confirm Storage Deletion</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This action is permanent and will remove objects from Supabase Storage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Box */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">Impact Summary</span>
            <span className="rounded bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 text-xs font-extrabold text-amber-900 dark:text-amber-100">
              Freed: {formatBytes(totalFreedBytes)}
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            You are about to delete <strong className="font-bold">{filesToDelete.length}</strong> object(s).
          </p>

          {linkedResources.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Warning: {linkedResources.length} file(s) are linked to live Course Resources!</span>
            </div>
          )}
        </div>

        {/* File Preview List */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
            Objects To Be Deleted ({filesToDelete.length})
          </label>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/60 p-2 dark:border-neutral-800 dark:bg-neutral-800/40 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {filesToDelete.map((f, i) => (
              <div key={`${f.bucket}-${f.path}-${i}`} className="py-2 px-2 flex items-center justify-between">
                <div className="truncate max-w-sm">
                  <span className="font-semibold text-neutral-900 dark:text-white block truncate">{f.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500 truncate block">{f.path} ({f.bucket})</span>
                  {f.linkedResource && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block truncate">
                      Linked: {f.linkedResource.courseCode || "Course"} - {f.linkedResource.title}
                    </span>
                  )}
                </div>
                <span className="font-bold text-neutral-900 dark:text-white shrink-0 ml-2">
                  {formatBytes(f.sizeBytes)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Confirm Deletion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
