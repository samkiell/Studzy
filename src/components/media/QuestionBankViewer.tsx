"use client";

import { useState } from "react";
import { downloadFile } from "@/lib/download";
import { FileJson, Download, Play, Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface QuestionBankViewerProps {
  src: string;
  title: string;
  courseCode?: string;
  resourceId?: string;
}

export function QuestionBankViewer({
  src,
  title,
  courseCode,
  resourceId,
}: QuestionBankViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    let filename = title || "questions";
    if (!filename.toLowerCase().endsWith(".json")) {
      filename += ".json";
    }

    try {
      await downloadFile(src, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header Banner */}
      <div className="border-b border-neutral-100 bg-amber-500/5 p-6 dark:border-neutral-800/80 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner dark:bg-amber-900/30 dark:text-amber-400">
              <FileJson className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mb-1.5">
                <Sparkles className="h-3 w-3" />
                CBT Question Bank
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl">
                {title}
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                JSON format question dataset formatted for CBT practice and mock tests.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isDownloading ? "Downloading..." : downloadSuccess ? "Downloaded!" : "Download JSON"}</span>
            </button>

            {courseCode && (
              <Link
                href={`/cbt?course=${courseCode}`}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Practice in CBT</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Source URL
            </span>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Direct Link</span>
            </a>
          </div>
          <p className="mt-1.5 truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
            {src}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-neutral-500">
            This question bank is synchronized with the CBT engine. You can practice all questions interactively or download the raw JSON for offline study.
          </div>
        </div>
      </div>
    </div>
  );
}
