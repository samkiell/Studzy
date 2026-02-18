"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Trash2, Download, FileJson, Calendar, BookOpen } from "lucide-react";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteResource } from "@/app/admin/actions"; // We reuse deleteResource since it's just a resource provided we update it to handle safely? 
// actually deleteResource handles file deletion and DB deletion.
// However, checking deleteResource implementation: it deletes from RAG bucket. 
// Our new upload logic puts it in "question-banks/" in RAG bucket.
// deleteResource logic: 
// const pathParts = url.pathname.split("/storage/v1/object/public/RAG/");
// const filePath = pathParts[1];
// This SHOULD work if the URL structure matches.

interface QuestionBank {
  id: string;
  title: string;
  course_code: string;
  file_url: string;
  created_at: string;
  size?: number; // Optional if we have it
}

interface AdminQuestionBankTableProps {
  files: QuestionBank[];
}

export function AdminQuestionBankTable({
  files: initialFiles,
}: AdminQuestionBankTableProps) {
  const [files, setFiles] = useState(initialFiles);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [fileToDelete, setFileToDelete] = useState<QuestionBank | null>(null);
  const deleteModal = useModal();

  const courseCodes = useMemo(() => {
    const codes = new Set(files.map(f => f.course_code));
    return Array.from(codes);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = filterCourse === "all" || f.course_code === filterCourse;
      return matchesSearch && matchesCourse;
    });
  }, [files, search, filterCourse]);

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    
    setLoadingId(fileToDelete.id);
    deleteModal.close();

    try {
      const result = await deleteResource(fileToDelete.id);

      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoadingId(null);
      setFileToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Courses</option>
              {courseCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">File Name</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Course</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Uploaded At</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                    No files found
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isLoading = loadingId === file.id;

                  return (
                    <tr
                      key={file.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isLoading ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <FileJson className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{file.title}</p>
                            <a 
                              href={file.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-primary-600 hover:underline"
                            >
                              Download JSON
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          <BookOpen className="h-3 w-3" />
                          {file.course_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">
                            {new Date(file.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a 
                            href={file.file_url} 
                            download
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => {
                              setFileToDelete(file);
                              deleteModal.open();
                            }}
                            disabled={isLoading}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Question Bank"
        description="Are you sure you want to delete this file? Note: This currently only removes the file record. Questions imported from it remain in the database."
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
