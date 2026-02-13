"use client";

import { useState } from "react";
import type { ResourceStatus } from "@/types/database";
import { Star } from "lucide-react";

interface AdminResource {
  id: string;
  title: string;
  type: string;
  status: ResourceStatus;
  featured: boolean;
  view_count: number;
  course_code: string;
  created_at: string;
}

interface AdminResourceTableProps {
  resources: AdminResource[];
}

export function AdminResourceTable({
  resources: initialResources,
}: AdminResourceTableProps) {
  const [resources, setResources] = useState(initialResources);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (
    resourceId: string,
    field: "featured" | "status",
    currentValue: boolean | string
  ) => {
    setLoadingId(resourceId);

    const newValue =
      field === "featured"
        ? !currentValue
        : currentValue === "published"
          ? "draft"
          : "published";

    // Optimistic update
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, [field]: newValue } : r
      )
    );

    try {
      const response = await fetch("/api/admin/toggle-resource", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, field, value: newValue }),
      });

      const result = await response.json();

      if (!result.success) {
        // Revert on failure
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, [field]: currentValue } : r
          )
        );
      }
    } catch {
      // Revert on error
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, [field]: currentValue } : r
        )
      );
    } finally {
      setLoadingId(null);
    }
  };

  const typeColors: Record<string, string> = {
    video:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    audio:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    pdf: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
              <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                Resource
              </th>
              <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                Course
              </th>
              <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                Type
              </th>
              <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                Views
              </th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                Featured
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {resources.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400"
                >
                  No resources found
                </td>
              </tr>
            ) : (
              resources.map((resource) => {
                const isLoading = loadingId === resource.id;

                return (
                  <tr
                    key={resource.id}
                    className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${isLoading ? "opacity-70" : ""}`}
                  >
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-900 dark:text-white">
                      {resource.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {resource.course_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${typeColors[resource.type] || ""}`}
                      >
                        {resource.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-white">
                      {resource.view_count.toLocaleString()}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleToggle(
                            resource.id,
                            "status",
                            resource.status
                          )
                        }
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:cursor-not-allowed ${
                          resource.status === "published"
                            ? "bg-green-500"
                            : "bg-neutral-300 dark:bg-neutral-600"
                        }`}
                        role="switch"
                        aria-checked={resource.status === "published"}
                        aria-label={`Toggle status for ${resource.title}`}
                        title={
                          resource.status === "published"
                            ? "Published — click to set as Draft"
                            : "Draft — click to Publish"
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            resource.status === "published"
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {resource.status === "published"
                          ? "Published"
                          : "Draft"}
                      </p>
                    </td>

                    {/* Featured Toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleToggle(
                            resource.id,
                            "featured",
                            resource.featured
                          )
                        }
                        disabled={isLoading}
                        className={`group inline-flex items-center justify-center rounded-lg p-2 transition-all disabled:cursor-not-allowed ${
                          resource.featured
                            ? "bg-amber-100 text-amber-500 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
                            : "bg-neutral-100 text-neutral-300 hover:bg-neutral-200 hover:text-amber-400 dark:bg-neutral-800 dark:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-amber-400"
                        }`}
                        aria-label={`${resource.featured ? "Remove from" : "Mark as"} featured for ${resource.title}`}
                        title={
                          resource.featured
                            ? "Featured — click to remove"
                            : "Not featured — click to feature"
                        }
                      >
                        <Star
                          className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                            resource.featured ? "fill-current text-amber-500" : "text-neutral-300 dark:text-neutral-600"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
