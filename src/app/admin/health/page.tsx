import React from "react";
import { getStorageHealthMetrics, getSystemHealthSummary } from "@/lib/health";
import { HealthMetricCard } from "@/components/admin/health/HealthMetricCard";
import { StorageBreakdownCard } from "@/components/admin/health/StorageBreakdownCard";
import { StorageWarningBanner } from "@/components/admin/health/StorageWarningBanner";
import { GrowthForecastCard } from "@/components/admin/health/GrowthForecastCard";
import { StorageManagementSection } from "@/components/admin/health/StorageManagementSection";
import { RefreshButton } from "@/components/admin/health/RefreshButton";
import { GUARDRAIL_CONFIG } from "@/config/storage-guardrails";
import { Activity, ShieldCheck } from "lucide-react";

export const revalidate = 600; // 10 minutes cache revalidation

export default async function AdminHealthPage() {
  const [storageMetrics, systemSummary] = await Promise.all([
    getStorageHealthMetrics(true),
    getSystemHealthSummary(true),
  ]);

  return (
    <div className="space-y-8">
      {/* 1. Header & Live Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Infrastructure
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            System & Storage Health
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Real-time Filebase S3 storage metrics, database quotas, and file management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton />
        </div>
      </div>

      {/* Storage Warning Banner (Only if threshold alert) */}
      <StorageWarningBanner status={storageMetrics.status} percentage={storageMetrics.usagePercentage} />

      {/* 2. Top 3 Core Quota Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <HealthMetricCard
          title="Filebase S3"
          subtitle="Persistent Storage"
          metric={systemSummary.storage}
          iconType="storage"
        />
        <HealthMetricCard
          title="Neon Database"
          subtitle="PostgreSQL Rows & Tables"
          metric={systemSummary.database}
          iconType="database"
        />
        <HealthMetricCard
          title="Network Bandwidth"
          subtitle="Monthly Data Transfer"
          metric={systemSummary.egress}
          iconType="egress"
        />
      </div>

      {/* 3. Storage Composition & Growth Projections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StorageBreakdownCard metrics={storageMetrics} />
        <GrowthForecastCard forecast={storageMetrics.forecast} />
      </div>

      {/* 4. Live Storage File Management */}
      <StorageManagementSection initialMetrics={storageMetrics} />

      {/* 5. Minimal Upload Limits Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/50 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Enforced Upload Limits:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white dark:bg-neutral-800 px-2.5 py-1 font-mono text-[11px] border border-neutral-200/60 dark:border-neutral-700/60">
            Video ≤ {(GUARDRAIL_CONFIG.maxFileSizes.video / (1024 * 1024)).toFixed(0)}MB
          </span>
          <span className="rounded-lg bg-white dark:bg-neutral-800 px-2.5 py-1 font-mono text-[11px] border border-neutral-200/60 dark:border-neutral-700/60">
            Audio ≤ {(GUARDRAIL_CONFIG.maxFileSizes.audio / (1024 * 1024)).toFixed(0)}MB
          </span>
          <span className="rounded-lg bg-white dark:bg-neutral-800 px-2.5 py-1 font-mono text-[11px] border border-neutral-200/60 dark:border-neutral-700/60">
            PDF ≤ {(GUARDRAIL_CONFIG.maxFileSizes.pdf / (1024 * 1024)).toFixed(0)}MB
          </span>
          <span className="rounded-lg bg-white dark:bg-neutral-800 px-2.5 py-1 font-mono text-[11px] border border-neutral-200/60 dark:border-neutral-700/60">
            Image ≤ {(GUARDRAIL_CONFIG.maxFileSizes.image / (1024 * 1024)).toFixed(0)}MB
          </span>
        </div>
      </div>
    </div>
  );
}
