"use client";

import React from "react";
import Link from "next/link";
import { SystemHealthSummary } from "@/lib/supabase/health/types";
import { getStatusBadgeStyle, getProgressBarColor } from "./HealthMetricCard";
import { Activity, ArrowRight, HardDrive, Database, Network, ShieldCheck } from "lucide-react";

interface SystemHealthSummaryWidgetProps {
  summary: SystemHealthSummary;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0)} ${sizes[i]}`;
}

export function SystemHealthSummaryWidget({ summary }: SystemHealthSummaryWidgetProps) {
  if (!summary.isAvailable) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">SYSTEM HEALTH</h2>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Usage data temporarily unavailable</span>
        </div>
      </div>
    );
  }

  const items = [
    { label: "Storage", icon: HardDrive, metric: summary.storage },
    { label: "Database", icon: Database, metric: summary.database },
    { label: "Egress", icon: Network, metric: summary.egress },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">SYSTEM HEALTH</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Supabase Quota & Protection</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${getStatusBadgeStyle(summary.overallStatus)}`}>
            {summary.overallStatus}
          </span>
          <Link
            href="/admin/health"
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map(({ label, icon: Icon, metric }) => (
          <div
            key={label}
            className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-neutral-500" />
                <span className="font-semibold text-neutral-900 dark:text-white">{label}</span>
              </div>
              <span className={`rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase ${getStatusBadgeStyle(metric.status)}`}>
                {metric.status}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {formatBytes(metric.currentUsageBytes)} / {formatBytes(metric.limitBytes)}
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">{metric.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className={`h-full transition-all ${getProgressBarColor(metric.status)}`}
                  style={{ width: `${Math.min(100, Math.max(3, metric.percentage))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
