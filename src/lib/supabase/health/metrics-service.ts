import { createAdminClient } from "@/lib/supabase/admin";
import { GUARDRAIL_CONFIG } from "@/config/supabase-guardrails";
import { 
  StorageHealthMetrics, 
  SystemHealthSummary, 
  BucketUsage, 
  FileTypeCategoryUsage, 
  StorageFileDetail 
} from "./types";
import { calculateQuotaMetric, calculateHealthStatus } from "./guardrail-utility";
import { calculateGrowthAndForecast } from "./forecasting";
import { listAllStorageObjectsWithResourceLinks } from "./storage-management";
import { logGuardrailEvent } from "./logger";

// Server-side in-memory metrics cache
let cachedStorageMetrics: { data: StorageHealthMetrics; timestamp: number } | null = null;
let cachedSystemSummary: { data: SystemHealthSummary; timestamp: number } | null = null;

/**
 * Clears in-memory health metrics cache forcing a fresh recalculation on next fetch
 */
export function invalidateHealthCache(): void {
  cachedStorageMetrics = null;
  cachedSystemSummary = null;
}

/**
 * Retrieves detailed storage health metrics across all Supabase buckets.
 * Uses in-memory server caching unless forceRefresh is set.
 */
export async function getStorageHealthMetrics(forceRefresh: boolean = false): Promise<StorageHealthMetrics> {
  const now = Date.now();
  const cacheTTLMs = GUARDRAIL_CONFIG.cacheTTLSeconds * 1000;

  if (!forceRefresh && cachedStorageMetrics && (now - cachedStorageMetrics.timestamp) < cacheTTLMs) {
    return cachedStorageMetrics.data;
  }

  try {
    const allFiles = await listAllStorageObjectsWithResourceLinks();

    const bucketTotals: Record<string, { sizeBytes: number; fileCount: number }> = {};
    const categoryTotals: Record<FileTypeCategoryUsage["category"], { sizeBytes: number; fileCount: number }> = {
      video: { sizeBytes: 0, fileCount: 0 },
      audio: { sizeBytes: 0, fileCount: 0 },
      pdf: { sizeBytes: 0, fileCount: 0 },
      image: { sizeBytes: 0, fileCount: 0 },
      document: { sizeBytes: 0, fileCount: 0 },
      other: { sizeBytes: 0, fileCount: 0 },
    };

    let totalSizeBytes = 0;
    let totalObjectCount = 0;

    for (const file of allFiles) {
      totalSizeBytes += file.sizeBytes;
      totalObjectCount += 1;

      // Bucket totals
      if (!bucketTotals[file.bucket]) {
        bucketTotals[file.bucket] = { sizeBytes: 0, fileCount: 0 };
      }
      bucketTotals[file.bucket].sizeBytes += file.sizeBytes;
      bucketTotals[file.bucket].fileCount += 1;

      // File category totals
      if (categoryTotals[file.fileType]) {
        categoryTotals[file.fileType].sizeBytes += file.sizeBytes;
        categoryTotals[file.fileType].fileCount += 1;
      } else {
        categoryTotals.other.sizeBytes += file.sizeBytes;
        categoryTotals.other.fileCount += 1;
      }
    }

    const safeTotal = totalSizeBytes > 0 ? totalSizeBytes : 1;

    // Build bucket usage breakdown
    const bucketUsages: BucketUsage[] = Object.entries(bucketTotals).map(([bId, data]) => ({
      bucketId: bId,
      bucketName: bId,
      sizeBytes: data.sizeBytes,
      objectCount: data.fileCount,
      percentageOfTotal: Number(((data.sizeBytes / safeTotal) * 100).toFixed(1)),
    }));

    // Build file category usage breakdown
    const fileTypes: FileTypeCategoryUsage[] = Object.entries(categoryTotals).map(([cat, data]) => ({
      category: cat as FileTypeCategoryUsage["category"],
      sizeBytes: data.sizeBytes,
      fileCount: data.fileCount,
      percentageOfTotal: Number(((data.sizeBytes / safeTotal) * 100).toFixed(1)),
    }));

    // Sort largest files
    const largestFiles = [...allFiles]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 10);

    const limitBytes = GUARDRAIL_CONFIG.planLimits.storageBytes;
    const remainingBytes = Math.max(0, limitBytes - totalSizeBytes);
    const usagePercentage = Number(((totalSizeBytes / limitBytes) * 100).toFixed(1));
    const status = calculateHealthStatus(usagePercentage);

    // Calculate growth and forecast data
    const forecast = calculateGrowthAndForecast(allFiles, limitBytes, totalSizeBytes);

    const metrics: StorageHealthMetrics = {
      totalSizeBytes,
      limitBytes,
      remainingBytes,
      usagePercentage,
      objectCount: totalObjectCount,
      status,
      buckets: bucketUsages.sort((a, b) => b.sizeBytes - a.sizeBytes),
      fileTypes: fileTypes.sort((a, b) => b.sizeBytes - a.sizeBytes),
      largestFiles,
      allFiles: allFiles.sort((a, b) => b.sizeBytes - a.sizeBytes),
      forecast,
      lastUpdated: new Date().toISOString(),
      isAvailable: true,
    };

    cachedStorageMetrics = { data: metrics, timestamp: now };
    return metrics;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error retrieving storage metrics";
    logGuardrailEvent({
      event: "METRIC_RETRIEVAL_FAILED",
      error: errorMsg,
    });

    const fallbackMetrics: StorageHealthMetrics = {
      totalSizeBytes: 0,
      limitBytes: GUARDRAIL_CONFIG.planLimits.storageBytes,
      remainingBytes: GUARDRAIL_CONFIG.planLimits.storageBytes,
      usagePercentage: 0,
      objectCount: 0,
      status: "Healthy",
      buckets: [],
      fileTypes: [],
      largestFiles: [],
      allFiles: [],
      forecast: {
        growth7DaysBytes: 0,
        growth30DaysBytes: 0,
        dailyGrowthRate7Days: 0,
        dailyGrowthRate30Days: 0,
        growthMethod: "Estimated Prediction",
        forecast80Percent: { date: null, daysRemaining: null },
        forecast90Percent: { date: null, daysRemaining: null },
        forecast100Percent: { date: null, daysRemaining: null },
      },
      lastUpdated: new Date().toISOString(),
      isAvailable: false,
      errorMessage: "Usage data temporarily unavailable.",
    };

    return fallbackMetrics;
  }
}

/**
 * Retrieves full System Health Summary (Storage, Database estimate, Egress, etc.)
 */
export async function getSystemHealthSummary(forceRefresh: boolean = false): Promise<SystemHealthSummary> {
  const now = Date.now();
  const cacheTTLMs = GUARDRAIL_CONFIG.cacheTTLSeconds * 1000;

  if (!forceRefresh && cachedSystemSummary && (now - cachedSystemSummary.timestamp) < cacheTTLMs) {
    return cachedSystemSummary.data;
  }

  const storageMetrics = await getStorageHealthMetrics(forceRefresh);
  const supabase = createAdminClient();

  let databaseTableCount = 0;
  let estimatedDbBytes = 0;

  try {
    const tables = ["courses", "resources", "profiles", "cbt_attempts", "rag_documents", "discussions"];
    let totalRows = 0;
    for (const t of tables) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (count) totalRows += count;
    }
    databaseTableCount = tables.length;
    estimatedDbBytes = (totalRows * 1500) + (15 * 1024 * 1024);
  } catch {
    estimatedDbBytes = 15 * 1024 * 1024;
  }

  const storageQuota = {
    ...calculateQuotaMetric(storageMetrics.totalSizeBytes, storageMetrics.limitBytes),
    resetBehavior: "Persistent Quota" as const,
  };

  const dbQuota = {
    ...calculateQuotaMetric(estimatedDbBytes, GUARDRAIL_CONFIG.planLimits.databaseBytes),
    resetBehavior: "Persistent Quota" as const,
  };

  const egressQuota = {
    ...calculateQuotaMetric(0, GUARDRAIL_CONFIG.planLimits.egressBytesMonthly),
    resetBehavior: "Resets Monthly" as const,
  };

  const statuses = [storageQuota.status, dbQuota.status, egressQuota.status];
  let overallStatus: SystemHealthSummary["overallStatus"] = "Healthy";
  if (statuses.includes("Exhausted")) overallStatus = "Exhausted";
  else if (statuses.includes("Critical")) overallStatus = "Critical";
  else if (statuses.includes("Warning")) overallStatus = "Warning";
  else if (statuses.includes("Notice")) overallStatus = "Notice";

  const summary: SystemHealthSummary = {
    storage: storageQuota,
    database: {
      ...dbQuota,
      tableCount: databaseTableCount,
    },
    egress: egressQuota,
    overallStatus,
    lastChecked: new Date().toISOString(),
    isAvailable: storageMetrics.isAvailable,
  };

  cachedSystemSummary = { data: summary, timestamp: now };
  return summary;
}
