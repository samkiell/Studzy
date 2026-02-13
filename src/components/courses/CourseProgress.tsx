"use client";

import { useEffect, useState } from "react";

interface CourseProgressProps {
  courseId: string;
  totalResources: number;
}

export function CourseProgress({ courseId, totalResources }: CourseProgressProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/mark-complete?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCompletedCount(data.completed?.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch course progress:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [courseId]);

  if (loading || totalResources === 0) {
    return null;
  }

  const percentage = Math.round((completedCount / totalResources) * 100);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Course Progress
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {completedCount} of {totalResources} completed
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage === 100 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Course completed!
        </p>
      )}
    </div>
  );
}
