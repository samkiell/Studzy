/**
 * Storage Health & Guardrails Type Definitions
 */

export type HealthStatus = "Healthy" | "Notice" | "Warning" | "Critical" | "Exhausted";

export interface QuotaMetricStatus {
  currentUsageBytes: number;
  limitBytes: number;
  percentage: number;
  remainingBytes: number;
  status: HealthStatus;
  resetBehavior: "Persistent Quota" | "Resets Monthly";
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

export interface LinkedApplicationResource {
  id: string;
  title: string;
  courseCode: string;
  courseTitle?: string;
  slug: string;
  type: string;
  status: string;
}

export interface StorageFileDetail {
  id?: string;
  name: string;
  path: string;
  bucket: string;
  sizeBytes: number;
  created_at: string;
  fileType: FileTypeCategoryUsage["category"];
  publicUrl?: string;
  resourceAppUrl?: string;
  courseAppUrl?: string;
  linkedResource?: LinkedApplicationResource;
}

export interface ForecastDetails {
  growth7DaysBytes: number;
  growth30DaysBytes: number;
  dailyGrowthRate7Days: number;
  dailyGrowthRate30Days: number;
  growthMethod: "Exact Derived Metrics" | "Estimated Prediction";
  forecast80Percent: { date: string | null; daysRemaining: number | null };
  forecast90Percent: { date: string | null; daysRemaining: number | null };
  forecast100Percent: { date: string | null; daysRemaining: number | null };
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
  allFiles: StorageFileDetail[];
  forecast: ForecastDetails;
  lastUpdated: string;
  isAvailable: boolean;
  errorMessage?: string;
}

export interface SystemHealthSummary {
  storage: QuotaMetricStatus;
  database: QuotaMetricStatus & { tableCount?: number };
  egress: QuotaMetricStatus;
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
