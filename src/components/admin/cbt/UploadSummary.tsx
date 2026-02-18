"use client";

import { CheckCircle2, Copy, AlertCircle, Info } from "lucide-react";

interface UploadSummaryProps {
  summary: {
    total: number;
    inserted: number;
    skipped: number;
  };
  courseCode: string;
}

export function UploadSummary({ summary, courseCode }: UploadSummaryProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 dark:border-green-900/50 dark:bg-green-900/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-900 dark:text-green-400">
              Upload Successful
            </h3>
            <p className="text-sm text-green-700 dark:text-green-500/80">
              Question bank for {courseCode} has been updated.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Processed */}
          <div className="rounded-lg bg-white p-4 shadow-sm border border-green-100 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1 text-neutral-500 dark:text-neutral-400">
              <Info className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {summary.total}
            </p>
          </div>

          {/* Inserted/Updated */}
          <div className="rounded-lg bg-white p-4 shadow-sm border border-green-100 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Inserted</span>
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {summary.inserted}
            </p>
          </div>

          {/* Skipped */}
          <div className="rounded-lg bg-white p-4 shadow-sm border border-green-100 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1 text-amber-500">
              <Copy className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Duplicates</span>
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">
              {summary.skipped}
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-white/50 p-4 border border-green-100/50 dark:bg-neutral-900/50 dark:border-neutral-800/50">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Duplicate questions (same Course Code and Question ID) were automatically handled via upsert. 
            The system ensures that each Question ID is unique within a course.
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <a 
          href="/admin/questions" 
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          View Question Banks
        </a>
      </div>
    </div>
  );
}
