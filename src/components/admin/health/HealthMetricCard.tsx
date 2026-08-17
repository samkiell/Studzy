"use client";

import React from "react";
import { HealthStatus, QuotaMetricStatus } from "@/lib/health/types";
import { HardDrive, Database, Network, Activity, ShieldCheck, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

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
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "Notice":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "Warning":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Critical":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    case "Exhausted":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  }
}

export function getProgressBarColor(status: HealthStatus) {
  switch (status) {
    case "Healthy":
      return "from-emerald-500 to-teal-400";
    case "Notice":
      return "from-blue-500 to-cyan-400";
    case "Warning":
      return "from-amber-500 to-yellow-400";
    case "Critical":
      return "from-orange-500 to-amber-500";
    case "Exhausted":
      return "from-red-600 to-rose-500";
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50 transition-colors group-hover:border-primary-500/30">
              <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">{title}</h3>
              {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getStatusBadgeStyle(metric.status)}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{metric.status}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {formatBytes(metric.currentUsageBytes)}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-sans">
                / {formatBytes(metric.limitBytes)}
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-700 dark:text-neutral-300">
              {metric.percentage}%
            </span>
          </div>

          {/* Elegant Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getProgressBarColor(metric.status)}`}
              style={{ width: `${Math.min(100, Math.max(2, metric.percentage))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80 pt-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Free: {formatBytes(metric.remainingBytes)}
        </span>
        {extraInfo ? (
          <span className="text-neutral-400">{extraInfo}</span>
        ) : (
          <span className="font-mono text-[11px] text-neutral-400">{metric.resetBehavior}</span>
        )}
      </div>
    </div>
  );
}
