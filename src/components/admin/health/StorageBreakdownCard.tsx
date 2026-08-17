"use client";

import React from "react";
import { StorageHealthMetrics } from "@/lib/health/types";
import { Video, Music, FileText, Image as ImageIcon, FileCode, FolderArchive, TrendingUp, HardDrive, Sparkles } from "lucide-react";

interface StorageBreakdownCardProps {
  metrics: StorageHealthMetrics;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 2 : 0)} ${sizes[i]}`;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string; barBg: string }> = {
  video: { label: "Videos", icon: Video, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", barBg: "bg-red-500" },
  audio: { label: "Audio", icon: Music, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", barBg: "bg-purple-500" },
  pdf: { label: "PDFs", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", barBg: "bg-amber-500" },
  image: { label: "Images", icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", barBg: "bg-emerald-500" },
  document: { label: "Documents", icon: FileCode, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", barBg: "bg-blue-500" },
  other: { label: "Other", icon: FolderArchive, color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/20", barBg: "bg-neutral-500" },
};

export function StorageBreakdownCard({ metrics }: StorageBreakdownCardProps) {
  if (!metrics.isAvailable) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {metrics.errorMessage || "Usage data temporarily unavailable."}
        </p>
      </div>
    );
  }

  const primaryBucket = metrics.buckets[0] || { bucketName: "studzy", objectCount: metrics.objectCount, sizeBytes: metrics.totalSizeBytes };

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900 flex flex-col justify-between space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              <HardDrive className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Storage Distribution</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {metrics.objectCount} objects stored across Filebase S3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></span>
              {primaryBucket.bucketName}
            </span>
          </div>
        </div>

        {/* Visual Continuous Multi-Segment Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800/80 p-0.5">
            {metrics.fileTypes.map((ft) => {
              if (ft.sizeBytes === 0) return null;
              const cfg = CATEGORY_CONFIG[ft.category] || CATEGORY_CONFIG.other;
              return (
                <div
                  key={ft.category}
                  className={`h-full rounded-full transition-all duration-300 ${cfg.barBg}`}
                  style={{ width: `${Math.max(1.5, ft.percentageOfTotal)}%` }}
                  title={`${cfg.label}: ${formatBytes(ft.sizeBytes)} (${ft.percentageOfTotal}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Media Categories Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {metrics.fileTypes.map((ft) => {
            const cfg = CATEGORY_CONFIG[ft.category] || CATEGORY_CONFIG.other;
            const Icon = cfg.icon;
            return (
              <div
                key={ft.category}
                className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 transition-colors`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{cfg.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
                    {ft.percentageOfTotal}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <p className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                    {formatBytes(ft.sizeBytes)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {ft.fileCount} {ft.fileCount === 1 ? "file" : "files"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Growth Forecast Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800/80 pt-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            7-Day Rate: <strong className="font-mono text-neutral-900 dark:text-white">+{formatBytes(metrics.forecast?.growth7DaysBytes || 0)}</strong>
          </span>
        </div>
        <div className="text-xs font-mono text-neutral-500">
          {metrics.forecast?.forecast80Percent?.date
            ? `Estimated 80% threshold: ${metrics.forecast.forecast80Percent.date}`
            : "Stable storage trajectory"}
        </div>
      </div>
    </div>
  );
}
