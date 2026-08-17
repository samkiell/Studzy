"use client";

import React from "react";
import { ForecastDetails } from "@/lib/health/types";
import { TrendingUp, Calendar, Sparkles, Activity } from "lucide-react";

interface GrowthForecastCardProps {
  forecast: ForecastDetails;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0)} ${sizes[i]}`;
}

export function GrowthForecastCard({ forecast }: GrowthForecastCardProps) {
  const milestoneCards = [
    {
      title: "80% Threshold",
      desc: "Warning trigger",
      data: forecast.forecast80Percent,
      pill: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "90% Emergency",
      desc: "Media restrictions",
      data: forecast.forecast90Percent,
      pill: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "100% Limit",
      desc: "Uploads disabled",
      data: forecast.forecast100Percent,
      pill: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900 flex flex-col justify-between space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Usage Velocity & Forecast</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Consumption rates & threshold projections</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
            <Activity className="h-3 w-3 text-primary-500" />
            {forecast.growthMethod}
          </span>
        </div>

        {/* Growth rates */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200/50 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">7-Day Ingestion</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                +{formatBytes(forecast.growth7DaysBytes)}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                +{formatBytes(forecast.dailyGrowthRate7Days)}/day
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/50 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/30">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">30-Day Ingestion</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                +{formatBytes(forecast.growth30DaysBytes)}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                +{formatBytes(forecast.dailyGrowthRate30Days)}/day
              </span>
            </div>
          </div>
        </div>

        {/* Threshold Milestones */}
        <div className="mt-5 space-y-2.5">
          <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Threshold Forecast Arrival
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {milestoneCards.map(({ title, desc, data, pill }) => (
              <div key={title} className="rounded-xl border border-neutral-200/60 bg-neutral-50/30 p-3 dark:border-neutral-800 dark:bg-neutral-800/20">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{title}</span>
                  <span className={`rounded-full border px-2 py-0.2 text-[10px] font-mono font-medium ${pill}`}>
                    {data.date ? (data.daysRemaining === 0 ? "Reached" : `~${data.daysRemaining}d`) : "Nominal"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="truncate">{data.date || "No overflow projected"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
