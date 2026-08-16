import { GUARDRAIL_CONFIG, QuotaThresholds } from "@/config/storage-guardrails";
import { HealthStatus, QuotaMetricStatus, UploadGuardCheckResult } from "./types";

/**
 * Calculates health status based on percentage usage and configured thresholds
 */
export function calculateHealthStatus(
  percentage: number,
  thresholds: QuotaThresholds = GUARDRAIL_CONFIG.thresholds
): HealthStatus {
  if (percentage >= thresholds.exhaustedPercent) return "Exhausted";
  if (percentage >= thresholds.criticalPercent) return "Critical";
  if (percentage >= thresholds.warningPercent) return "Warning";
  if (percentage >= thresholds.noticePercent) return "Notice";
  return "Healthy";
}

/**
 * Calculates a complete QuotaMetricStatus object given current usage, limit, and thresholds
 */
export function calculateQuotaMetric(
  currentUsageBytes: number,
  limitBytes: number,
  thresholds: QuotaThresholds = GUARDRAIL_CONFIG.thresholds,
  resetBehavior: "Persistent Quota" | "Resets Monthly" = "Persistent Quota"
): QuotaMetricStatus {
  const safeLimit = limitBytes > 0 ? limitBytes : 1;
  const rawPercentage = (currentUsageBytes / safeLimit) * 100;
  const percentage = Math.min(100, Math.max(0, Number(rawPercentage.toFixed(1))));
  const remainingBytes = Math.max(0, limitBytes - currentUsageBytes);
  const status = calculateHealthStatus(percentage, thresholds);

  return {
    currentUsageBytes,
    limitBytes,
    percentage,
    remainingBytes,
    status,
    resetBehavior,
  };
}

/**
 * Evaluates whether an upload of incomingSizeBytes should be allowed based on:
 * 1. Resource max file size limit
 * 2. Projected quota usage crossing critical threshold
 */
export function evaluateUploadSafety(
  currentStorageBytes: number,
  incomingSizeBytes: number,
  resourceType: string,
  storageLimitBytes: number = GUARDRAIL_CONFIG.planLimits.storageBytes,
  thresholds: QuotaThresholds = GUARDRAIL_CONFIG.thresholds
): UploadGuardCheckResult {
  // 1. Max file size check
  const fileTypeKey = (resourceType.toLowerCase() as keyof typeof GUARDRAIL_CONFIG.maxFileSizes) || "other";
  const maxAllowedForType = GUARDRAIL_CONFIG.maxFileSizes[fileTypeKey] || GUARDRAIL_CONFIG.maxFileSizes.other;

  if (incomingSizeBytes > maxAllowedForType) {
    const maxMB = (maxAllowedForType / (1024 * 1024)).toFixed(0);
    const fileMB = (incomingSizeBytes / (1024 * 1024)).toFixed(2);
    return {
      allowed: false,
      fileSize: incomingSizeBytes,
      maxFileSizeAllowed: maxAllowedForType,
      resourceType,
      currentStorageBytes,
      projectedStorageBytes: currentStorageBytes + incomingSizeBytes,
      projectedPercentage: Number((((currentStorageBytes + incomingSizeBytes) / storageLimitBytes) * 100).toFixed(1)),
      status: calculateHealthStatus((currentStorageBytes / storageLimitBytes) * 100, thresholds),
      reason: `Upload blocked: file size (${fileMB} MB) exceeds maximum limit of ${maxMB} MB for ${resourceType}.`,
    };
  }

  // 2. Projected quota check
  const projectedStorageBytes = currentStorageBytes + incomingSizeBytes;
  const projectedRawPercent = (projectedStorageBytes / storageLimitBytes) * 100;
  const projectedPercentage = Number(projectedRawPercent.toFixed(1));
  const projectedStatus = calculateHealthStatus(projectedPercentage, thresholds);

  if (projectedPercentage >= thresholds.criticalPercent) {
    const projectedMB = (projectedStorageBytes / (1024 * 1024)).toFixed(1);
    const limitMB = (storageLimitBytes / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      fileSize: incomingSizeBytes,
      maxFileSizeAllowed: maxAllowedForType,
      resourceType,
      currentStorageBytes,
      projectedStorageBytes,
      projectedPercentage,
      status: projectedStatus,
      reason: `Upload blocked: this file would push Storage beyond the safe limit (${projectedPercentage}% / ${projectedMB} MB of ${limitMB} MB).`,
    };
  }

  return {
    allowed: true,
    fileSize: incomingSizeBytes,
    maxFileSizeAllowed: maxAllowedForType,
    resourceType,
    currentStorageBytes,
    projectedStorageBytes,
    projectedPercentage,
    status: projectedStatus,
  };
}
