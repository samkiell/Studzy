"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceFilterTabs, type FilterTab } from "./ResourceFilterTabs";
import type { Resource } from "@/types/database";

interface ResourceListProps {
  resources: Resource[];
  courseId: string;
}

export function ResourceList({ resources, courseId }: ResourceListProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

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

  // Count resources by type
  const counts = useMemo(
    () => ({
      all: resources.length,
      video: resources.filter((r) => r.type === "video").length,
      audio: resources.filter((r) => r.type === "audio").length,
      pdf: resources.filter((r) => r.type === "pdf").length,
    }),
    [resources]
  );

  // Filter resources based on active tab
  const filteredResources = useMemo(() => {
    if (activeFilter === "all") return resources;
    return resources.filter((r) => r.type === activeFilter);
  }, [resources, activeFilter]);

  // Separate featured from non-featured (no duplication)
  const featuredResources = useMemo(
    () => filteredResources.filter((r) => r.featured),
    [filteredResources]
  );

  const regularResources = useMemo(
    () => filteredResources.filter((r) => !r.featured),
    [filteredResources]
  );

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
    <div className="space-y-6">
      {/* Filter Tabs */}
      <ResourceFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Filtered Resource List */}
      <div
        id="resource-list-panel"
        role="tabpanel"
        aria-labelledby={`filter-tab-${activeFilter}`}
        className="space-y-6"
      >
        {filteredResources.length > 0 ? (
          <>
            {/* Featured / Recommended for Exam Section */}
            {featuredResources.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <svg
                      className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      Recommended for Exam
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {featuredResources.length} essential{" "}
                      {featuredResources.length === 1 ? "resource" : "resources"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
                  {featuredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      courseId={courseId}
                      isCompleted={completedIds.includes(resource.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Resources */}
            {regularResources.length > 0 && (
              <div className="space-y-3">
                {featuredResources.length > 0 && (
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    All Resources
                  </h3>
                )}
                {regularResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    courseId={courseId}
                    isCompleted={completedIds.includes(resource.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No{" "}
              <span className="font-medium">
                {activeFilter === "video"
                  ? "video"
                  : activeFilter === "audio"
                    ? "audio"
                    : "PDF"}
              </span>{" "}
              resources available for this course.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
