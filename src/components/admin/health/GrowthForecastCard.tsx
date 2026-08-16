"use client";

import React from "react";
import { ForecastDetails } from "@/lib/health/types";
import { TrendingUp, Calendar, AlertCircle, ShieldAlert, Sparkles } from "lucide-react";

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
      title: "80% Critical Limit",
      desc: "Upload restrictions trigger",
      data: forecast.forecast80Percent,
      color: "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    },
    {
      title: "90% Emergency",
      desc: "Aggressive media blocking",
      data: forecast.forecast90Percent,
      color: "border-orange-200 bg-orange-50/50 text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300",
      badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300",
    },
    {
      title: "100% Quota Exhaustion",
      desc: "All uploads disabled",
      data: forecast.forecast100Percent,
      color: "border-red-200 bg-red-50/50 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300",
      badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300",
    },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Storage Growth & Quota Forecast</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Historical consumption velocity and threshold predictions</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 w-fit">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{forecast.growthMethod}</span>
        </div>
      </div>

      {/* Growth rates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-100 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">7-Day Growth Rate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              +{formatBytes(forecast.growth7DaysBytes)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              (+{formatBytes(forecast.dailyGrowthRate7Days)}/day)
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">30-Day Growth Rate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              +{formatBytes(forecast.growth30DaysBytes)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              (+{formatBytes(forecast.dailyGrowthRate30Days)}/day)
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Forecast Predictions */}
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Projected Threshold Arrival Dates
        </h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {milestoneCards.map(({ title, desc, data, color, badgeColor }) => (
            <div key={title} className={`rounded-xl border p-4 transition-all ${color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{title}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
                  {data.date ? (data.daysRemaining === 0 ? "Exceeded" : `~${data.daysRemaining} days`) : "No overflow projected"}
                </span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">{desc}</p>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-extrabold">
                <Calendar className="h-4 w-4" />
                <span>{data.date || "Stable (No date projected)"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
