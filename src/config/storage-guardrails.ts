/**
 * Storage & Health Guardrails Configuration
 * Centralized settings for quotas, thresholds, and upload restrictions.
 */

export interface QuotaThresholds {
  noticePercent: number; // 60%
  warningPercent: number; // 70%
  criticalPercent: number; // 80% (Uploads blocked)
  emergencyPercent: number; // 90%
  exhaustedPercent: number; // 100%
}

export interface PlanLimits {
  storageBytes: number; // e.g. 5GB or configured limit
  databaseBytes: number; // e.g. 500MB
  egressBytesMonthly: number; // e.g. 10GB
  cachedEgressBytesMonthly: number;
}

export interface MaxFileSizes {
  video: number;
  audio: number;
  pdf: number;
  image: number;
  document: number;
  other: number;
}

export const GUARDRAIL_CONFIG = {
  // Default thresholds
  thresholds: {
    noticePercent: 60,
    warningPercent: 70,
    criticalPercent: 80,
    emergencyPercent: 90,
    exhaustedPercent: 100,
  } as QuotaThresholds,

  // Default storage quotas (Adjustable via environment variables)
  planLimits: {
    // 5 GB default storage limit
    storageBytes: (parseInt(process.env.STORAGE_LIMIT_MB || "5120", 10)) * 1024 * 1024,
    // 500 MB default database limit
    databaseBytes: 500 * 1024 * 1024,
    // 10 GB monthly egress
    egressBytesMonthly: 10 * 1024 * 1024 * 1024,
    cachedEgressBytesMonthly: 20 * 1024 * 1024 * 1024,
  } as PlanLimits,

  // Maximum file sizes allowed per type (in bytes)
  maxFileSizes: {
    video: 100 * 1024 * 1024,   // 100 MB
    audio: 50 * 1024 * 1024,    // 50 MB
    pdf: 30 * 1024 * 1024,      // 30 MB
    image: 10 * 1024 * 1024,    // 10 MB
    document: 20 * 1024 * 1024, // 20 MB
    other: 20 * 1024 * 1024,    // 20 MB
  } as MaxFileSizes,

  // Storage metric cache duration in seconds (10 minutes)
  cacheTTLSeconds: 600,
};
