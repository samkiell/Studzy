"use client";

import React from "react";
import { StorageHealthMetrics } from "@/lib/supabase/health/types";
import { Video, Music, FileText, Image as ImageIcon, FileCode, FolderArchive, TrendingUp, HardDrive, File } from "lucide-react";

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

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  video: { label: "Videos", icon: Video, color: "text-red-500", bg: "bg-red-500" },
  audio: { label: "Audio", icon: Music, color: "text-purple-500", bg: "bg-purple-500" },
  pdf: { label: "PDFs", icon: FileText, color: "text-amber-500", bg: "bg-amber-500" },
  image: { label: "Images", icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-500" },
  document: { label: "Documents", icon: FileCode, color: "text-emerald-500", bg: "bg-emerald-500" },
  other: { label: "Other", icon: FolderArchive, color: "text-neutral-500", bg: "bg-neutral-500" },
};

export function StorageBreakdownCard({ metrics }: StorageBreakdownCardProps) {
  if (!metrics.isAvailable) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {metrics.errorMessage || "Usage data temporarily unavailable."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Overview Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Total Storage Used</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
            {formatBytes(metrics.totalSizeBytes)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {metrics.objectCount} objects stored
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">7-Day Growth</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              +{formatBytes(metrics.forecast?.growth7DaysBytes || 0)}
            </p>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            30-day: +{formatBytes(metrics.forecast?.growth30DaysBytes || 0)}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Quota Time Estimate</p>
          <p className="mt-1 text-base font-bold text-neutral-900 dark:text-white">
            {metrics.forecast?.forecast80Percent?.date
              ? `80% Est: ${metrics.forecast.forecast80Percent.date}`
              : "Stable usage rate"}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {metrics.forecast?.forecast100Percent?.date
              ? `100% Est: ${metrics.forecast.forecast100Percent.date}`
              : "No threshold overflow imminent"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 📁 Storage Grouped by Bucket */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-neutral-900 dark:text-white">Storage by Bucket</h3>
          </div>

          <div className="space-y-4">
            {metrics.buckets.map((bucket) => (
              <div key={bucket.bucketId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">{bucket.bucketName}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">({bucket.objectCount} files)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-neutral-900 dark:text-white">{formatBytes(bucket.sizeBytes)}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">({bucket.percentageOfTotal}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full bg-primary-600 dark:bg-primary-500"
                    style={{ width: `${Math.max(1, bucket.percentageOfTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🎨 Storage Grouped by File Type */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2 mb-4">
            <File className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-neutral-900 dark:text-white">Storage by Resource Type</h3>
          </div>

          {/* Visual multi-segment bar */}
          <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {metrics.fileTypes.map((ft) => {
              if (ft.sizeBytes === 0) return null;
              const cfg = CATEGORY_CONFIG[ft.category] || CATEGORY_CONFIG.other;
              return (
                <div
                  key={ft.category}
                  className={`h-full ${cfg.bg}`}
                  style={{ width: `${ft.percentageOfTotal}%` }}
                  title={`${cfg.label}: ${formatBytes(ft.sizeBytes)} (${ft.percentageOfTotal}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.fileTypes.map((ft) => {
              const cfg = CATEGORY_CONFIG[ft.category] || CATEGORY_CONFIG.other;
              const Icon = cfg.icon;
              return (
                <div
                  key={ft.category}
                  className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{cfg.label}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-neutral-900 dark:text-white">
                    {formatBytes(ft.sizeBytes)}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {ft.fileCount} files ({ft.percentageOfTotal}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📦 Largest Files */}
      {metrics.largestFiles.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">Largest Objects in Storage</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Bucket</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {metrics.largestFiles.map((file, idx) => (
                  <tr key={`${file.bucket}-${file.path}-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-white truncate max-w-xs" title={file.path}>
                      <span className="block truncate">{file.name}</span>
                      {file.linkedResource && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block truncate">
                          Linked: {file.linkedResource.courseCode ? `${file.linkedResource.courseCode} - ` : ""}{file.linkedResource.title}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono dark:bg-neutral-800">{file.bucket}</span>
                    </td>
                    <td className="py-2.5 px-3 text-xs uppercase font-semibold text-neutral-500">
                      {file.fileType}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs whitespace-nowrap">
                      {file.resourceAppUrl ? (
                        <a
                          href={file.resourceAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-primary-600 hover:underline dark:text-primary-400"
                        >
                          <span>App Page</span>
                        </a>
                      ) : file.publicUrl ? (
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-neutral-500 hover:underline"
                        >
                          <span>File URL</span>
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
