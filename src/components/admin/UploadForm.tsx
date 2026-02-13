"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Course, ResourceType } from "@/types/database";

interface UploadFormProps {
  courses: Course[];
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
  title: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FILE_TYPES: Record<ResourceType, { accept: string; label: string }> = {
  audio: { accept: "audio/*,.mp3,.wav,.ogg,.m4a", label: "Audio files (MP3, WAV, OGG, M4A)" },
  video: { accept: "video/*,.mp4,.webm,.mov", label: "Video files (MP4, WebM, MOV)" },
  pdf: { accept: ".pdf,application/pdf", label: "PDF documents" },
};

export function UploadForm({ courses }: UploadFormProps) {
  const [selectedType, setSelectedType] = useState<ResourceType>("video");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Scroll to message when it appears
  useEffect(() => {
    if (globalMessage && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [globalMessage]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFilesSelect = (newFiles: File[]) => {
    const validFiles: FileUpload[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 100MB limit`);
        return;
      }

      // Generate title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: "pending",
        title,
      });
    });

    if (errors.length > 0) {
      setGlobalMessage({
        type: "error",
        text: `Some files were rejected: ${errors.join("; ")}`,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      if (errors.length === 0) setGlobalMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(Array.from(e.target.files));
      // Reset input so same files can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, title } : f))
    );
  };

  const uploadFile = (fileUpload: FileUpload, courseId: string, type: ResourceType): Promise<void> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id ? { ...f, progress, status: "uploading" } : f
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileUpload.id
                  ? { ...f, progress: 100, status: "success", message: response.message }
                  : f
              )
            );
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileUpload.id
                  ? { ...f, status: "error", message: response.message || "Upload failed" }
                  : f
              )
            );
          }
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? { ...f, status: "error", message: "Invalid response from server" }
                : f
            )
          );
        }
        resolve();
      });

      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id
              ? { ...f, status: "error", message: "Network error occurred" }
              : f
          )
        );
        resolve();
      });

      xhr.addEventListener("abort", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id
              ? { ...f, status: "error", message: "Upload cancelled" }
              : f
          )
        );
        resolve();
      });

      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("title", fileUpload.title);
      formData.append("type", type);
      formData.append("file", fileUpload.file);

      xhr.open("POST", "/api/admin/upload");
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
      setGlobalMessage({ type: "error", text: "Please select a course" });
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");
    if (pendingFiles.length === 0) {
      setGlobalMessage({ type: "error", text: "No files to upload" });
      return;
    }

    // Check for empty titles
    const emptyTitles = pendingFiles.filter((f) => !f.title.trim());
    if (emptyTitles.length > 0) {
      setGlobalMessage({ type: "error", text: "Please enter titles for all files" });
      return;
    }

    setIsUploading(true);
    setGlobalMessage(null);

    // Reset error files to pending
    setFiles((prev) =>
      prev.map((f) => (f.status === "error" ? { ...f, status: "pending", progress: 0 } : f))
    );

    // Upload files sequentially to avoid overwhelming the server
    for (const fileUpload of pendingFiles) {
      await uploadFile(fileUpload, selectedCourseId, selectedType);
    }

    setIsUploading(false);

    // Check results
    const updatedFiles = files.filter((f) => pendingFiles.some((pf) => pf.id === f.id));
    const successCount = updatedFiles.filter((f) => f.status === "success").length;
    const errorCount = updatedFiles.filter((f) => f.status === "error").length;

    if (errorCount === 0 && successCount > 0) {
      setGlobalMessage({
        type: "success",
        text: `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}!`,
      });
      // Clear successful files after a delay
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"));
      }, 2000);
    } else if (errorCount > 0 && successCount > 0) {
      setGlobalMessage({
        type: "error",
        text: `${successCount} file${successCount > 1 ? "s" : ""} uploaded, ${errorCount} failed. Check individual errors below.`,
      });
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "success"));
  };

  const clearAll = () => {
    setFiles([]);
    setGlobalMessage(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Selection */}
      <div>
        <label
          htmlFor="courseId"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Course <span className="text-red-500">*</span>
        </label>
        <select
          id="courseId"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          required
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Resource Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Resource Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["video", "audio", "pdf"] as ResourceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelectedType(type);
                setFiles([]);
              }}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                selectedType === type
                  ? type === "video"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : type === "audio"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
              }`}
            >
              {type === "video" && (
                <svg
                  className={`h-6 w-6 ${selectedType === type ? "text-red-600" : "text-neutral-500"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {type === "audio" && (
                <svg
                  className={`h-6 w-6 ${selectedType === type ? "text-purple-600" : "text-neutral-500"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              )}
              {type === "pdf" && (
                <svg
                  className={`h-6 w-6 ${selectedType === type ? "text-blue-600" : "text-neutral-500"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
              <span
                className={`text-sm font-medium capitalize ${
                  selectedType === type ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Zone */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Upload Files <span className="text-red-500">*</span>
        </label>
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : files.length > 0
              ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
              : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_TYPES[selectedType].accept}
            onChange={handleFileChange}
            multiple
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Choose files to upload"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg
                className="h-7 w-7 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                Drag and drop files here
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                or click to browse • Multiple files allowed
              </p>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {FILE_TYPES[selectedType].label} • Max 100MB per file
            </p>
          </div>
        </div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Files ({files.length})
            </h3>
            <div className="flex gap-2">
              {successCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Clear completed
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {files.map((fileUpload) => (
              <div
                key={fileUpload.id}
                className={`rounded-lg border p-3 ${
                  fileUpload.status === "success"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                    : fileUpload.status === "error"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                    : fileUpload.status === "uploading"
                    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20"
                    : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-1 shrink-0">
                    {fileUpload.status === "success" ? (
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : fileUpload.status === "error" ? (
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : fileUpload.status === "uploading" ? (
                      <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    {fileUpload.status === "pending" ? (
                      <input
                        type="text"
                        value={fileUpload.title}
                        onChange={(e) => updateFileTitle(fileUpload.id, e.target.value)}
                        placeholder="Enter title..."
                        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      />
                    ) : (
                      <p className="truncate font-medium text-neutral-900 dark:text-white">
                        {fileUpload.title}
                      </p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {fileUpload.file.name} • {formatFileSize(fileUpload.file.size)}
                    </p>
                    {fileUpload.message && (
                      <p
                        className={`mt-1 text-xs ${
                          fileUpload.status === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {fileUpload.message}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {fileUpload.status === "uploading" && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{fileUpload.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${fileUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {(fileUpload.status === "pending" || fileUpload.status === "error") && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileUpload.id)}
                      className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || pendingCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload {pendingCount} {pendingCount === 1 ? "File" : "Files"}
          </>
        )}
      </button>

      {/* Global Message - Below Button */}
      {globalMessage && (
        <div
          ref={messageRef}
          className={`rounded-lg p-4 ${
            globalMessage.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          <div className="flex items-start gap-3">
            {globalMessage.type === "success" ? (
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div className="flex-1">
              <p className="font-medium">{globalMessage.text}</p>
              {globalMessage.type === "error" && (
                <button
                  type="button"
                  onClick={() => setGlobalMessage(null)}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
