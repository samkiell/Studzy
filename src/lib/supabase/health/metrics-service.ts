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
import { logGuardrailEvent } from "./logger";

// Server-side in-memory metrics cache
let cachedStorageMetrics: { data: StorageHealthMetrics; timestamp: number } | null = null;
let cachedSystemSummary: { data: SystemHealthSummary; timestamp: number } | null = null;

interface RawFileObject {
  id?: string | null;
  name: string;
  bucket: string;
  path: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
  created_at?: string;
}

/**
 * Categorizes a file by MIME type or extension into standard categories:
 * video, audio, pdf, image, document, or other.
 */

function categorizeFileType(name: string, mimeType?: string): FileTypeCategoryUsage["category"] {
  const lowerName = name.toLowerCase();
  const ext = lowerName.split(".").pop() || "";
  const lowerMime = (mimeType || "").toLowerCase();

  if (lowerMime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) {
    return "video";
  }
  if (lowerMime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
    return "audio";
  }
  if (lowerMime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (lowerMime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  }
  if (
    lowerMime.startsWith("text/") || 
    lowerMime.includes("json") || 
    lowerMime.includes("javascript") ||
    ["txt", "doc", "docx", "md", "csv", "json", "js", "ts", "py"].includes(ext)
  ) {
    return "document";
  }
  return "other";
}

/**
 * Recursively lists all objects in a Supabase Storage bucket
 */
async function listAllBucketObjects(
  supabase: ReturnType<typeof createAdminClient>,
  bucketId: string,
  folderPath: string = ""
): Promise<RawFileObject[]> {
  let fileList: RawFileObject[] = [];
  
  const { data, error } = await supabase.storage.from(bucketId).list(folderPath, { limit: 1000 });
  if (error || !data) return fileList;

  for (const item of data) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    if (!item.metadata || !item.id) {
      // It's a folder: recurse into subfolder
      const subFiles = await listAllBucketObjects(supabase, bucketId, fullPath);
      fileList = fileList.concat(subFiles);
    } else {
      fileList.push({
        id: item.id,
        name: item.name,
        bucket: bucketId,
        path: fullPath,
        metadata: item.metadata as RawFileObject["metadata"],
        created_at: item.created_at ?? undefined,
      });
    }
  }

  return fileList;
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
    const supabase = createAdminClient();
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      throw new Error(`Failed to list storage buckets: ${bucketError.message}`);
    }

    const bucketUsages: BucketUsage[] = [];
    const categoryTotals: Record<FileTypeCategoryUsage["category"], { sizeBytes: number; fileCount: number }> = {
      video: { sizeBytes: 0, fileCount: 0 },
      audio: { sizeBytes: 0, fileCount: 0 },
      pdf: { sizeBytes: 0, fileCount: 0 },
      image: { sizeBytes: 0, fileCount: 0 },
      document: { sizeBytes: 0, fileCount: 0 },
      other: { sizeBytes: 0, fileCount: 0 },
    };

    const allFiles: StorageFileDetail[] = [];
    let totalSizeBytes = 0;
    let totalObjectCount = 0;
    let growth7DaysBytes = 0;
    let growth30DaysBytes = 0;

    const sevenDaysAgoMs = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoMs = now - (30 * 24 * 60 * 60 * 1000);

    for (const bucket of buckets || []) {
      const objects = await listAllBucketObjects(supabase, bucket.id);
      let bucketSizeBytes = 0;

      for (const obj of objects) {
        const size = obj.metadata?.size || 0;
        const mime = obj.metadata?.mimetype || "";
        const category = categorizeFileType(obj.name, mime);

        bucketSizeBytes += size;
        totalSizeBytes += size;
        totalObjectCount += 1;

        categoryTotals[category].sizeBytes += size;
        categoryTotals[category].fileCount += 1;

        // Check growth window
        const createdMs = obj.created_at ? new Date(obj.created_at).getTime() : now;
        if (createdMs >= sevenDaysAgoMs) growth7DaysBytes += size;
        if (createdMs >= thirtyDaysAgoMs) growth30DaysBytes += size;

        allFiles.push({
          name: obj.name,
          path: obj.path,
          bucket: bucket.id,
          sizeBytes: size,
          created_at: obj.created_at || new Date().toISOString(),
          fileType: category,
        });
      }

      bucketUsages.push({
        bucketId: bucket.id,
        bucketName: bucket.name || bucket.id,
        sizeBytes: bucketSizeBytes,
        objectCount: objects.length,
        percentageOfTotal: 0, // Will be computed after totalSizeBytes is final
      });
    }

    // Calculate percentage per bucket
    const safeTotal = totalSizeBytes > 0 ? totalSizeBytes : 1;
    bucketUsages.forEach((b) => {
      b.percentageOfTotal = Number(((b.sizeBytes / safeTotal) * 100).toFixed(1));
    });

    // Calculate percentage per file category
    const fileTypes: FileTypeCategoryUsage[] = Object.entries(categoryTotals).map(([cat, data]) => ({
      category: cat as FileTypeCategoryUsage["category"],
      sizeBytes: data.sizeBytes,
      fileCount: data.fileCount,
      percentageOfTotal: Number(((data.sizeBytes / safeTotal) * 100).toFixed(1)),
    }));

    // Sort largest files
    const largestFiles = allFiles
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 10);

    const limitBytes = GUARDRAIL_CONFIG.planLimits.storageBytes;
    const remainingBytes = Math.max(0, limitBytes - totalSizeBytes);
    const usagePercentage = Number(((totalSizeBytes / limitBytes) * 100).toFixed(1));
    const status = calculateHealthStatus(usagePercentage);

    // Calculate estimated time to warning (70%) and critical (80%) thresholds based on 7-day rate
    let estimatedDaysToWarning: number | null = null;
    let estimatedDaysToCritical: number | null = null;

    if (growth7DaysBytes > 0) {
      const dailyGrowthRateBytes = growth7DaysBytes / 7;
      const warningTargetBytes = limitBytes * (GUARDRAIL_CONFIG.thresholds.warningPercent / 100);
      const criticalTargetBytes = limitBytes * (GUARDRAIL_CONFIG.thresholds.criticalPercent / 100);

      if (totalSizeBytes < warningTargetBytes) {
        estimatedDaysToWarning = Math.round((warningTargetBytes - totalSizeBytes) / dailyGrowthRateBytes);
      }
      if (totalSizeBytes < criticalTargetBytes) {
        estimatedDaysToCritical = Math.round((criticalTargetBytes - totalSizeBytes) / dailyGrowthRateBytes);
      }
    }

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
      growth7DaysBytes,
      growth30DaysBytes,
      estimatedDaysToWarning,
      estimatedDaysToCritical,
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
      growth7DaysBytes: 0,
      growth30DaysBytes: 0,
      estimatedDaysToWarning: null,
      estimatedDaysToCritical: null,
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
    // Check main tables for row counts to construct an estimated database footprint
    const tables = ["courses", "resources", "profiles", "cbt_attempts", "rag_documents", "discussions"];
    let totalRows = 0;
    for (const t of tables) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (count) totalRows += count;
    }
    databaseTableCount = tables.length;
    // Rough estimation: average ~1.5 KB per row + base pg schema overhead (~15 MB)
    estimatedDbBytes = (totalRows * 1500) + (15 * 1024 * 1024);
  } catch {
    estimatedDbBytes = 15 * 1024 * 1024;
  }

  const storageQuota = calculateQuotaMetric(storageMetrics.totalSizeBytes, storageMetrics.limitBytes);
  const dbQuota = calculateQuotaMetric(estimatedDbBytes, GUARDRAIL_CONFIG.planLimits.databaseBytes);
  const egressQuota = calculateQuotaMetric(0, GUARDRAIL_CONFIG.planLimits.egressBytesMonthly);

  // Overall status is the worst status among core metrics
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
