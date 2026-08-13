/**
 * Supabase Health & Guardrails Type Definitions
 */

export type HealthStatus = "Healthy" | "Notice" | "Warning" | "Critical" | "Exhausted";

export interface QuotaMetricStatus {
  currentUsageBytes: number;
  limitBytes: number;
  percentage: number;
  remainingBytes: number;
  status: HealthStatus;
}

export interface BucketUsage {
  bucketId: string;
  bucketName: string;
  sizeBytes: number;
  objectCount: number;
  percentageOfTotal: number;
}

export interface FileTypeCategoryUsage {
  category: "video" | "audio" | "pdf" | "image" | "document" | "other";
  sizeBytes: number;
  fileCount: number;
  percentageOfTotal: number;
}

export interface StorageFileDetail {
  name: string;
  path: string;
  bucket: string;
  sizeBytes: number;
  created_at: string;
  fileType: string;
}

export interface StorageHealthMetrics {
  totalSizeBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usagePercentage: number;
  objectCount: number;
  status: HealthStatus;
  buckets: BucketUsage[];
  fileTypes: FileTypeCategoryUsage[];
  largestFiles: StorageFileDetail[];
  growth7DaysBytes: number;
  growth30DaysBytes: number;
  estimatedDaysToWarning: number | null;
  estimatedDaysToCritical: number | null;
  lastUpdated: string;
  isAvailable: boolean;
  errorMessage?: string;
}

export interface SystemHealthSummary {
  storage: QuotaMetricStatus;
  database: QuotaMetricStatus & { tableCount?: number };
  egress: QuotaMetricStatus;
  cachedEgress?: QuotaMetricStatus;
  realtime?: { activeConnections: number; status: HealthStatus };
  edgeFunctions?: { invocations: number; status: HealthStatus };
  overallStatus: HealthStatus;
  lastChecked: string;
  isAvailable: boolean;
}

export interface UploadGuardCheckResult {
  allowed: boolean;
  fileSize: number;
  maxFileSizeAllowed: number;
  resourceType: string;
  currentStorageBytes: number;
  projectedStorageBytes: number;
  projectedPercentage: number;
  status: HealthStatus;
  reason?: string;
}
