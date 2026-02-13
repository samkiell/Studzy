"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceFilterTabs, type FilterTab } from "./ResourceFilterTabs";
import type { Resource } from "@/types/database";
import { Inbox, Star } from "lucide-react";

interface ResourceListProps {
  resources: Resource[];
  courseId: string;
  courseCode: string;
}

export function ResourceList({ resources, courseId, courseCode }: ResourceListProps) {
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
          <Inbox className="h-8 w-8 text-neutral-400" />
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
                    <Star className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 fill-current" />
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
                      courseCode={courseCode}
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
                    courseCode={courseCode}
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
