"use client";

import React, { useState } from "react";
import { HealthStatus } from "@/lib/health/types";
import { AlertTriangle, AlertCircle, XCircle, X } from "lucide-react";

interface StorageWarningBannerProps {
  status: HealthStatus;
  percentage: number;
}

export function StorageWarningBanner({ status, percentage }: StorageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || status === "Healthy" || status === "Notice") {
    return null;
  }

  let bannerStyle = "";
  let Icon = AlertTriangle;
  let message = "";

  switch (status) {
    case "Warning":
      bannerStyle = "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-200";
      Icon = AlertTriangle;
      message = `Storage is at ${percentage}%. Monitor storage usage.`;
      break;
    case "Critical":
      bannerStyle = "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/80 dark:border-orange-800 dark:text-orange-200";
      Icon = AlertCircle;
      message = `Storage is critically high (${percentage}%). Large media uploads may be blocked.`;
      break;
    case "Exhausted":
      bannerStyle = "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/80 dark:border-red-800 dark:text-red-200";
      Icon = XCircle;
      message = `Storage quota exhausted (${percentage}%). Media uploads are currently disabled.`;
      break;
    default:
      return null;
  }

  return (
    <div className={`flex items-center justify-between rounded-xl border p-4 mb-6 transition-all ${bannerStyle}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        title="Dismiss warning"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
