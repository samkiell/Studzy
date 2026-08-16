import { getStorageHealthMetrics } from "./metrics-service";
import { evaluateUploadSafety } from "./guardrail-utility";
import { logGuardrailEvent } from "./logger";
import { UploadGuardCheckResult } from "./types";
import { GUARDRAIL_CONFIG } from "@/config/storage-guardrails";

/**
 * Validates whether a file upload of given size and resource type is safe to proceed.
 * MUST be invoked server-side before executing storage upload.
 */
export async function checkUploadGuardrail(
  incomingSizeBytes: number,
  resourceType: string
): Promise<UploadGuardCheckResult> {
  const currentMetrics = await getStorageHealthMetrics();

  // If metrics service fails to retrieve current usage, handle fail-safe evaluation:
  // For files larger than 20MB, reject when metric data is unavailable to prevent silent quota overruns.
  if (!currentMetrics.isAvailable) {
    if (incomingSizeBytes > 20 * 1024 * 1024) {
      logGuardrailEvent({
        event: "UPLOAD_BLOCKED",
        resourceType,
        fileSizeBytes: incomingSizeBytes,
        reason: "Upload blocked: System health metrics are currently unavailable for large files.",
      });
      return {
        allowed: false,
        fileSize: incomingSizeBytes,
        maxFileSizeAllowed: GUARDRAIL_CONFIG.maxFileSizes.other,
        resourceType,
        currentStorageBytes: 0,
        projectedStorageBytes: incomingSizeBytes,
        projectedPercentage: 0,
        status: "Warning",
        reason: "Upload blocked: usage metrics are temporarily unavailable. Large uploads restricted.",
      };
    }
  }

  const result = evaluateUploadSafety(
    currentMetrics.totalSizeBytes,
    incomingSizeBytes,
    resourceType,
    currentMetrics.limitBytes
  );

  if (!result.allowed) {
    logGuardrailEvent({
      event: "UPLOAD_BLOCKED",
      resourceType,
      fileSizeBytes: incomingSizeBytes,
      currentStorageBytes: currentMetrics.totalSizeBytes,
      projectedPercentage: result.projectedPercentage,
      status: result.status,
      reason: result.reason,
    });
  } else {
    logGuardrailEvent({
      event: "UPLOAD_ALLOWED",
      resourceType,
      fileSizeBytes: incomingSizeBytes,
      currentStorageBytes: currentMetrics.totalSizeBytes,
      projectedPercentage: result.projectedPercentage,
      status: result.status,
    });
  }

  return result;
}
