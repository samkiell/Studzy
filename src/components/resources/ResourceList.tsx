"use client";

import { useEffect, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import type { Resource } from "@/types/database";

interface ResourceListProps {
  resources: Resource[];
  courseId: string;
}

export function ResourceList({ resources, courseId }: ResourceListProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/mark-complete?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCompletedIds(data.completed || []);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    }

    if (resources.length > 0) {
      fetchProgress();
    }
  }, [courseId, resources.length]);

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          No resources yet
        </h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Resources for this course will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} courseId={courseId} />
      ))}
    </div>
  );
}
