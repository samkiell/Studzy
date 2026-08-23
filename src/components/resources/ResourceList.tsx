"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceFilterTabs, type FilterTab } from "./ResourceFilterTabs";
import type { Resource } from "@/types/database";
import { Inbox, Star, BrainCircuit, FileCode } from "lucide-react";

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

  // Separate standard study resources from CBT JSON files
  const standardResources = useMemo(
    () => resources.filter((r) => r.type !== "question_bank"),
    [resources]
  );

  const cbtResources = useMemo(
    () => resources.filter((r) => r.type === "question_bank"),
    [resources]
  );

  // Count standard resources by type
  const counts = useMemo(
    () => ({
      all: standardResources.length,
      video: standardResources.filter((r) => r.type === "video").length,
      audio: standardResources.filter((r) => r.type === "audio").length,
      pdf: standardResources.filter((r) => r.type === "pdf").length,
      image: standardResources.filter((r) => r.type === "image").length,
      document: standardResources.filter((r) => r.type === "document").length,
      question_bank: cbtResources.length,
    }),
    [standardResources, cbtResources]
  );

  // Filter standard resources based on active tab
  const filteredResources = useMemo(() => {
    if (activeFilter === "all") return standardResources;
    return standardResources.filter((r) => r.type === activeFilter);
  }, [standardResources, activeFilter]);

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
    <div className="space-y-8">
      {/* Standard Resource Filter Tabs */}
      {standardResources.length > 0 && (
        <ResourceFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      )}

      {/* Filtered Standard Resource List */}
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
        ) : standardResources.length > 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No{" "}
              <span className="font-medium">
                {activeFilter === "video"
                  ? "video"
                  : activeFilter === "audio"
                    ? "audio"
                    : activeFilter === "pdf"
                    ? "PDF"
                    : activeFilter === "document"
                    ? "document"
                    : activeFilter}
              </span>{" "}
              resources available for this course.
            </p>
          </div>
        ) : null}
      </div>

      {/* Dedicated CBT JSON Question Banks Section at the Bottom */}
      {cbtResources.length > 0 && (
        <section aria-label="CBT Question Banks" className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  CBT Question Banks & Practice Sets
                  <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {cbtResources.length} {cbtResources.length === 1 ? "JSON Bank" : "JSON Banks"}
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Interactive past questions and practice material compiled from uploaded CBT JSON banks.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cbtResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                courseCode={courseCode}
                isCompleted={completedIds.includes(resource.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
