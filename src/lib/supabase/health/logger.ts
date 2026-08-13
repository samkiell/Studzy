/**
 * Server-side guardrail logger
 * Logs guardrail decisions, quota events, and metric status changes without exposing secrets or payload contents.
 */

export type GuardrailEvent = 
  | "UPLOAD_ALLOWED"
  | "UPLOAD_BLOCKED"
  | "THRESHOLD_CROSSED"
  | "METRIC_RETRIEVAL_FAILED"
  | "STORAGE_HEALTH_CHANGED";

export interface LogPayload {
  event: GuardrailEvent;
  resourceType?: string;
  fileSizeBytes?: number;
  currentStorageBytes?: number;
  projectedPercentage?: number;
  status?: string;
  reason?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export function logGuardrailEvent(payload: LogPayload): void {
  const timestamp = new Date().toISOString();
  const prefix = `[SUPABASE GUARDRAIL ${payload.event}]`;

  const safeLog = {
    timestamp,
    ...payload,
  };

  switch (payload.event) {
    case "UPLOAD_BLOCKED":
      console.warn(`${prefix} Upload rejected: ${payload.reason || "Safety threshold exceeded"}`);
      break;
    case "THRESHOLD_CROSSED":
      console.warn(`${prefix} Quota threshold entered ${payload.status} state at ${payload.projectedPercentage}% usage`);
      break;
    case "METRIC_RETRIEVAL_FAILED":
      console.error(`${prefix} Failed to retrieve Supabase metrics: ${payload.error}`);
      break;
    case "STORAGE_HEALTH_CHANGED":
      console.info(`${prefix} Storage health changed to ${payload.status}`);
      break;
    case "UPLOAD_ALLOWED":
    default:
      console.info(`${prefix} Allowed upload (${(payload.fileSizeBytes ? payload.fileSizeBytes / (1024*1024) : 0).toFixed(2)} MB)`);
      break;
  }
}
