import { StorageFileDetail } from "./types";
import { GUARDRAIL_CONFIG } from "@/config/storage-guardrails";

export interface ForecastData {
  growth7DaysBytes: number;
  growth30DaysBytes: number;
  dailyGrowthRate7Days: number;
  dailyGrowthRate30Days: number;
  growthMethod: "Exact Derived Metrics" | "Estimated Prediction";
  forecast80Percent: { date: string | null; daysRemaining: number | null };
  forecast90Percent: { date: string | null; daysRemaining: number | null };
  forecast100Percent: { date: string | null; daysRemaining: number | null };
}

/**
 * Calculates historical 7-day and 30-day growth rates from actual file creation dates
 * and projects forecasted arrival dates for 80%, 90%, and 100% storage thresholds.
 */
export function calculateGrowthAndForecast(
  files: StorageFileDetail[],
  limitBytes: number = GUARDRAIL_CONFIG.planLimits.storageBytes,
  totalSizeBytes: number = 0
): ForecastData {
  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  let growth7DaysBytes = 0;
  let growth30DaysBytes = 0;

  for (const file of files) {
    const createdMs = file.created_at ? new Date(file.created_at).getTime() : nowMs;
    if (createdMs >= sevenDaysAgoMs) growth7DaysBytes += file.sizeBytes;
    if (createdMs >= thirtyDaysAgoMs) growth30DaysBytes += file.sizeBytes;
  }

  const dailyGrowthRate7Days = growth7DaysBytes / 7;
  const dailyGrowthRate30Days = growth30DaysBytes / 30;

  const activeDailyRate = dailyGrowthRate7Days > 0 ? dailyGrowthRate7Days : dailyGrowthRate30Days;

  const target80Bytes = limitBytes * 0.8;
  const target90Bytes = limitBytes * 0.9;
  const target100Bytes = limitBytes * 1.0;

  const calculateTargetForecast = (targetBytes: number) => {
    if (totalSizeBytes >= targetBytes) {
      return { date: "Threshold Exceeded", daysRemaining: 0 };
    }
    if (activeDailyRate <= 0) {
      return { date: null, daysRemaining: null };
    }
    const bytesNeeded = targetBytes - totalSizeBytes;
    const days = Math.ceil(bytesNeeded / activeDailyRate);
    const projectedDate = new Date(nowMs + days * 24 * 60 * 60 * 1000);
    const dateStr = projectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return { date: dateStr, daysRemaining: days };
  };

  return {
    growth7DaysBytes,
    growth30DaysBytes,
    dailyGrowthRate7Days,
    dailyGrowthRate30Days,
    growthMethod: "Exact Derived Metrics",
    forecast80Percent: calculateTargetForecast(target80Bytes),
    forecast90Percent: calculateTargetForecast(target90Bytes),
    forecast100Percent: calculateTargetForecast(target100Bytes),
  };
}
