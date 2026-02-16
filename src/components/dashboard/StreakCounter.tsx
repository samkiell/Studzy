"use client";

import { Flame } from "lucide-react";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/30">
        <Flame className={`h-7 w-7 ${streak > 0 ? "animate-bounce" : ""}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Current Streak</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-orange-900 dark:text-white">{streak}</span>
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Days</span>
        </div>
      </div>
    </div>
  );
}
