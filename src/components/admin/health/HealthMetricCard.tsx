"use client";

import React from "react";
import { HealthStatus, QuotaMetricStatus } from "@/lib/supabase/health/types";
import { HardDrive, Database, Network, Activity, AlertTriangle, ShieldCheck, AlertCircle, XCircle, RotateCcw, Lock } from "lucide-react";

interface HealthMetricCardProps {
  title: string;
  metric: QuotaMetricStatus;
  iconType?: "storage" | "database" | "egress" | "general";
  subtitle?: string;
  extraInfo?: string;
}

export function getStatusBadgeStyle(status: HealthStatus) {
  switch (status) {
    case "Healthy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "Notice":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "Warning":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "Critical":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800";
    case "Exhausted":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
  }
}

export function getProgressBarColor(status: HealthStatus) {
  switch (status) {
    case "Healthy":
      return "bg-emerald-500 dark:bg-emerald-400";
    case "Notice":
      return "bg-blue-500 dark:bg-blue-400";
    case "Warning":
      return "bg-amber-500 dark:bg-amber-400";
    case "Critical":
      return "bg-orange-500 dark:bg-orange-400";
    case "Exhausted":
      return "bg-red-600 dark:bg-red-500";
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 2 : 0)} ${sizes[i]}`;
}

export function HealthMetricCard({ title, metric, iconType = "general", subtitle, extraInfo }: HealthMetricCardProps) {
  const Icon = iconType === "storage" ? HardDrive : iconType === "database" ? Database : iconType === "egress" ? Network : Activity;
  const StatusIcon = metric.status === "Healthy" ? ShieldCheck : metric.status === "Notice" ? Activity : metric.status === "Warning" ? AlertTriangle : metric.status === "Critical" ? AlertCircle : XCircle;

  const isPersistent = metric.resetBehavior === "Persistent Quota";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
              {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusBadgeStyle(metric.status)}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{metric.status}</span>
          </div>
        </div>

        {/* Persistent vs Monthly reset badge */}
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {isPersistent ? (
            <>
              <Lock className="h-3 w-3 text-amber-500" />
              <span>Persistent Quota (Does not reset monthly)</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-3 w-3 text-blue-500" />
              <span>Monthly Resetting Usage (Resets 1st of month)</span>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatBytes(metric.currentUsageBytes)}
              </span>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                / {formatBytes(metric.limitBytes)}
              </span>
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {metric.percentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${getProgressBarColor(metric.status)}`}
              style={{ width: `${Math.min(100, Math.max(2, metric.percentage))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Remaining: {formatBytes(metric.remainingBytes)}</span>
        {extraInfo && <span>{extraInfo}</span>}
      </div>
    </div>
  );
}
