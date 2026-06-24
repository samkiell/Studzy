"use client";

import { AlertTriangle, CheckCircle2, FileJson, HelpCircle, Layers } from "lucide-react";

interface CBTPreviewProps {
  preview: {
    totalQuestions: number;
    topics: { name: string; count: number }[];
    difficultyCounts: Record<string, number>;
    questionTypes: Record<string, number>;
    isValid: boolean;
    errors: string[];
  };
  fileName: string;
  fileSize: number;
}

export function CBTPreview({ preview, fileName, fileSize }: CBTPreviewProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className={`rounded-xl border p-5 ${
        preview.isValid 
          ? "border-green-200 bg-green-50/20 dark:border-green-900/10 dark:bg-green-900/5"
          : "border-red-200 bg-red-50/20 dark:border-red-900/10 dark:bg-red-900/5"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b pb-3 border-neutral-200/50 dark:border-neutral-800/50">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              preview.isValid ? "bg-green-100 text-green-600 dark:bg-green-900/40" : "bg-red-100 text-red-600 dark:bg-red-900/40"
            }`}>
              <FileJson className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                JSON Content Preview
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {fileName} ({formatSize(fileSize)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {preview.isValid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid Format
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                <AlertTriangle className="h-3.5 w-3.5" />
                Warnings Detected
              </span>
            )}
          </div>
        </div>

        {/* Validation Errors Box */}
        {!preview.isValid && preview.errors.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/15 border border-red-100 dark:border-red-950/30 p-3.5 text-xs text-red-800 dark:text-red-400">
            <div className="flex items-center gap-1.5 font-bold mb-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Formatting Errors Detected:</span>
            </div>
            <ul className="list-inside list-disc space-y-1 pl-1 opacity-90">
              {preview.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] opacity-75 font-medium">
              Note: You can still attempt to upload, but database validation or processing may fail.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Questions Card */}
          <div className="rounded-xl bg-white p-4 border border-neutral-200/60 dark:bg-neutral-900/60 dark:border-neutral-800/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <HelpCircle className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1.5">
              {preview.totalQuestions}
            </p>
          </div>

          {/* Topics Card */}
          <div className="rounded-xl bg-white p-4 border border-neutral-200/60 dark:bg-neutral-900/60 dark:border-neutral-800/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <Layers className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Topics</span>
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1.5">
              {preview.topics.length}
            </p>
          </div>

          {/* Difficulty & Type Distribution Card */}
          <div className="rounded-xl bg-white p-4 border border-neutral-200/60 dark:bg-neutral-900/60 dark:border-neutral-800/60 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Distribution
            </span>
            <div className="space-y-1.5 font-medium">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>Difficulties:</span>
                <span className="font-bold font-mono">
                  {Object.entries(preview.difficultyCounts)
                    .map(([diff, count]) => `${diff[0].toUpperCase()}:${count}`)
                    .join(" | ") || "None"}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>Types:</span>
                <span className="font-bold font-mono">
                  {Object.entries(preview.questionTypes)
                    .map(([type, count]) => `${type.toUpperCase()}:${count}`)
                    .join(" | ") || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Topics List Detail */}
        {preview.topics.length > 0 && (
          <div className="mt-4 border-t border-neutral-200/50 dark:border-neutral-800/50 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
              Topic Breakdown
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {preview.topics.map((t, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1 rounded bg-neutral-100 hover:bg-neutral-200/70 px-2 py-0.5 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 transition-colors"
                >
                  <span className="max-w-[150px] truncate font-medium">{t.name}</span>
                  <span className="rounded-full bg-neutral-200/80 dark:bg-neutral-700 px-1 py-0.2 text-[10px] font-black">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
