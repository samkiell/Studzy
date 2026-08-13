import React from "react";
import { getStorageHealthMetrics, getSystemHealthSummary } from "@/lib/supabase/health";
import { HealthMetricCard } from "@/components/admin/health/HealthMetricCard";
import { StorageBreakdownCard } from "@/components/admin/health/StorageBreakdownCard";
import { StorageWarningBanner } from "@/components/admin/health/StorageWarningBanner";
import { GUARDRAIL_CONFIG } from "@/config/supabase-guardrails";
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export const revalidate = 600; // 10 minutes cache revalidation

export default async function AdminHealthPage() {
  const [storageMetrics, systemSummary] = await Promise.all([
    getStorageHealthMetrics(true),
    getSystemHealthSummary(true),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin System Health & Guardrails</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Monitor Supabase resource consumption and protection limits
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Last updated: {new Date(storageMetrics.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Warning Banner if thresholds are reached */}
      <StorageWarningBanner status={storageMetrics.status} percentage={storageMetrics.usagePercentage} />

      {/* Primary Quota Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HealthMetricCard
          title="Supabase Storage"
          subtitle={`${storageMetrics.objectCount} total objects`}
          metric={systemSummary.storage}
          iconType="storage"
          extraInfo="Pre-upload restricted at 80%"
        />

        <HealthMetricCard
          title="Database Footprint"
          subtitle={`Tables monitored: ${systemSummary.database.tableCount || 0}`}
          metric={systemSummary.database}
          iconType="database"
          extraInfo="PostgreSQL rows"
        />

        <HealthMetricCard
          title="Monthly Egress"
          subtitle="Data bandwidth limit"
          metric={systemSummary.egress}
          iconType="egress"
          extraInfo="Resets monthly"
        />
      </div>

      {/* Detailed Storage Breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Storage Deep-Dive</h2>
        <StorageBreakdownCard metrics={storageMetrics} />
      </div>

      {/* Guardrail Policy Overview */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <h3 className="font-bold text-neutral-900 dark:text-white">Active Guardrail Policy Configuration</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Upload safety rules are dynamically enforced prior to storage uploads to prevent project quota exhaustion.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Threshold Rules */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-neutral-500">Threshold Milestones</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                <span className="font-medium">60% = Notice</span>
                <span className="text-blue-600 font-semibold dark:text-blue-400">Monitoring Active</span>
              </div>
              <div className="flex justify-between rounded-lg bg-amber-50/60 p-2.5 dark:bg-amber-950/30">
                <span className="font-medium text-amber-900 dark:text-amber-200">70% = Warning</span>
                <span className="text-amber-700 font-semibold dark:text-amber-400">Admin Banner Alert</span>
              </div>
              <div className="flex justify-between rounded-lg bg-orange-50/60 p-2.5 dark:bg-orange-950/30">
                <span className="font-medium text-orange-900 dark:text-orange-200">80% = Critical Threshold</span>
                <span className="text-orange-700 font-semibold dark:text-orange-400">Large Uploads Blocked</span>
              </div>
              <div className="flex justify-between rounded-lg bg-red-50/60 p-2.5 dark:bg-red-950/30">
                <span className="font-medium text-red-900 dark:text-red-200">90% = Emergency / 100% Exhausted</span>
                <span className="text-red-700 font-semibold dark:text-red-400">All Uploads Restricted</span>
              </div>
            </div>
          </div>

          {/* File Size Restrictions */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-neutral-500">Configured Max File Sizes</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                <span className="text-xs text-neutral-500 block">Video Files</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {(GUARDRAIL_CONFIG.maxFileSizes.video / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                <span className="text-xs text-neutral-500 block">Audio Files</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {(GUARDRAIL_CONFIG.maxFileSizes.audio / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                <span className="text-xs text-neutral-500 block">PDF Documents</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {(GUARDRAIL_CONFIG.maxFileSizes.pdf / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
              <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                <span className="text-xs text-neutral-500 block">Images</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {(GUARDRAIL_CONFIG.maxFileSizes.image / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
