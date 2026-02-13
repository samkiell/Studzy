"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadFile } from "@/lib/download";
import { Check, Download, Share2, ExternalLink, Loader2 } from "lucide-react";

interface PDFViewerProps {
  src: string;
  title: string;
  resourceId?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export function PDFViewer({ src, title, resourceId, isCompleted = false, onComplete }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const [isDownloading, setIsDownloading] = useState(false);

  const markAsDone = async () => {
    if (!resourceId || isMarking || completed) return;
    
    setIsMarking(true);
    try {
      await fetch("/api/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      setCompleted(true);
      onComplete?.();
    } catch (err) {
      console.error("Failed to mark PDF complete:", err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadFile(src, `${title.replace(/\s+/g, "_")}.pdf`);
    setIsDownloading(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 sm:h-10 sm:w-10">
            <svg
              className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-white sm:text-base">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {resourceId && (
            <button
              onClick={markAsDone}
              disabled={isMarking || completed}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                completed
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {completed ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Completed</span>
                </>
              ) : isMarking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Marking...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Mark as Done</span>
                </>
              )}
            </button>
          )}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Open</span>
          </a>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${isDownloading ? "opacity-70 cursor-wait" : ""}`}
            title="Download PDF"
          >
            <Download className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDownloading ? "animate-pulse" : ""}`} />
            <span className="hidden xs:inline">{isDownloading ? "Downloading..." : "Download"}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="relative h-[60vh] min-h-[400px] sm:h-[80vh] sm:min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading PDF...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  Unable to load PDF
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Try opening in a new tab or downloading the file
                </p>
              </div>
            </div>
          </div>
        )}

        <iframe
          src={`${src}#toolbar=1&navpanes=1&scrollbar=1`}
          className="h-full w-full"
          title={title}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />

        {/* Studzy Watermark */}
        <div className="pointer-events-none absolute bottom-4 left-4 select-none">
          <span className="text-lg font-bold text-blue-400/50 drop-shadow-md">Studzy</span>
        </div>
      </div>
    </div>
  );
}
