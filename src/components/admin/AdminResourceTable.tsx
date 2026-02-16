"use client";

import { useState, useMemo } from "react";
import type { ResourceStatus } from "@/types/database";
import { Star, Search, Filter, Trash2, Edit3, Loader2, Hash, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { EditResourceModal } from "./EditResourceModal";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AdminResource {
  id: string;
  title: string;
  type: string;
  status: ResourceStatus;
  featured: boolean;
  view_count: number;
  course_code: string;
  created_at: string;
  description?: string;
}

interface AdminResourceTableProps {
  resources: AdminResource[];
}

export function AdminResourceTable({
  resources: initialResources,
}: AdminResourceTableProps) {
  const [resources, setResources] = useState(initialResources);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AdminResource | null>(null);
  const deleteModal = useModal();

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                             r.course_code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      const matchesType = filterType === "all" || r.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [resources, search, filterStatus, filterType]);

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    
    setLoadingId(resourceToDelete.id);
    deleteModal.close();

    try {
      const response = await fetch("/api/admin/delete-resource", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resourceToDelete.id }),
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoadingId(null);
      setResourceToDelete(null);
    }
  };

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
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, [field]: currentValue } : r
          )
        );
      }
    } catch {
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
    video: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    audio: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    pdf: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    image: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search resources or courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <option value="all">All Types</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Resource</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Course</th>
                <th className="hidden sm:table-cell px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Stats</th>
                <th className="px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">Status</th>
                <th className="hidden md:table-cell px-6 py-4 text-center font-semibold text-neutral-900 dark:text-white">Featured</th>
                <th className="hidden lg:table-cell px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Updated</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No resources match your filters
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => {
                  const isLoading = loadingId === resource.id;

                  return (
                    <tr
                      key={resource.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isLoading ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden ${typeColors[resource.type]}`}>
                            {resource.type === "image" ? (
                              <img src={resource.file_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Hash className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">{resource.title}</p>
                            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">{resource.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          {resource.course_code}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white">{resource.view_count.toLocaleString()}</span>
                          <span className="text-[10px] text-neutral-500 uppercase">Views</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(resource.id, "status", resource.status)}
                          disabled={isLoading}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                            resource.status === "published" ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            resource.status === "published" ? "translate-x-5.5" : "translate-x-1"
                          }`} />
                        </button>
                        <p className="mt-1 text-[10px] font-bold uppercase text-neutral-500">{resource.status}</p>
                      </td>

                      {/* Featured */}
                      <td className="hidden md:table-cell px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(resource.id, "featured", resource.featured)}
                          disabled={isLoading}
                          className={`p-2 rounded-lg transition-colors ${
                            resource.featured 
                              ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" 
                              : "text-neutral-300 hover:text-amber-400"
                          }`}
                        >
                          <Star className={`h-5 w-5 ${resource.featured ? "fill-current" : ""}`} />
                        </button>
                      </td>
 
                      {/* Updated */}
                      <td className="hidden lg:table-cell px-6 py-4 text-right text-xs font-medium text-neutral-500 whitespace-nowrap">
                        {new Date(resource.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingResource(resource)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResourceToDelete(resource);
                              deleteModal.open();
                            }}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingResource && (
        <EditResourceModal
          resource={editingResource as any}
          onClose={() => setEditingResource(null)}
          onSave={(updated) => {
            setResources(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } as AdminResource : r));
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Resource"
        description={`Are you sure you want to delete "${resourceToDelete?.title}"? This action cannot be undone and will remove the file from storage.`}
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={deleteModal.close}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent"
            >
              Delete
            </Button>
          </div>
        }
      />
    </div>
  );
}
