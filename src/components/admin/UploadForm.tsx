"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  PencilLine, 
  CloudUpload, 
  CheckCircle2, 
  AlertCircle, 
  FileStack,
  Trash2,
  Loader2
} from "lucide-react";
import type { Course, ResourceType, ResourceStatus } from "@/types/database";

interface UploadFormProps {
  courses: Course[];
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "saving" | "success" | "error";
  message?: string;
  title: string;
  slug: string;
  description: string;
  fileUrl?: string;
  storagePath?: string;
  type: ResourceType;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FILE_TYPES: Record<ResourceType, { accept: string; label: string }> = {
  audio: { accept: "audio/*,.mp3,.wav,.ogg,.m4a", label: "Audio files (MP3, WAV, OGG, M4A)" },
  video: { accept: "video/*,.mp4,.webm,.mov", label: "Video files (MP4, WebM, MOV)" },
  pdf: { accept: ".pdf,application/pdf", label: "PDF documents" },
};

// Auto-detect resource type from MIME type
const detectResourceType = (file: File): ResourceType | null => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  
  // Fallback: check file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (["mp4", "webm", "mov", "avi"].includes(ext || "")) return "video";
  if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext || "")) return "audio";
  if (ext === "pdf") return "pdf";
  
  return null;
};

export function UploadForm({ courses }: UploadFormProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isRAG, setIsRAG] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus>("published");
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
  }, [selectedCourseId]);

  // Upload file to storage immediately
  const uploadFileToStorage = useCallback((fileUpload: FileUpload): Promise<{ fileUrl: string; storagePath: string } | null> => {
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
                  ? { ...f, progress: 100, status: "uploaded", fileUrl: response.fileUrl, storagePath: response.storagePath }
                  : f
              )
            );
            resolve({ fileUrl: response.fileUrl, storagePath: response.storagePath });
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileUpload.id
                  ? { ...f, status: "error", message: response.message || "Upload failed" }
                  : f
              )
            );
            resolve(null);
          }
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? { ...f, status: "error", message: "Invalid response from server" }
                : f
            )
          );
          resolve(null);
        }
      });

      xhr.addEventListener("error", () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id
              ? { ...f, status: "error", message: "Network error occurred" }
              : f
          )
        );
        resolve(null);
      });

      const formData = new FormData();
      formData.append("file", fileUpload.file);
      formData.append("type", fileUpload.type);
      if (isRAG) {
        formData.append("isRAG", "true");
      }

      xhr.open("POST", "/api/admin/upload-file");
      xhr.send(formData);
    });
  }, [isRAG]);

  const handleFilesSelect = async (newFiles: File[]) => {
    if (!selectedCourseId && !isRAG) {
      setGlobalMessage({ type: "error", text: "Please select a course or enable RAG mode first" });
      return;
    }

    const validFiles: FileUpload[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 100MB limit`);
        return;
      }

      // Auto-detect file type
      const detectedType = detectResourceType(file);
      if (!detectedType) {
        errors.push(`${file.name}: unsupported file type`);
        return;
      }

      // Auto-generate title from filename (strip extension)
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      
      // Auto-generate slug from title
      const autoSlug = autoTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: "pending",
        title: autoTitle,
        slug: autoSlug,
        description: "",
        type: detectedType,
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

      // Start uploading files immediately
      for (const fileUpload of validFiles) {
        await uploadFileToStorage(fileUpload);
      }
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

  const removeFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    
    // If file was uploaded, delete from storage
    if (file?.storagePath) {
      try {
        await fetch("/api/admin/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.storagePath }),
        });
      } catch (error) {
        console.error("Failed to delete file from storage:", error);
      }
    }
    
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          // Also update slug if it was just auto-generated and not manually edited?
          // For now, let's just make it easier for admin to edit both.
          const newSlug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50);
          return { ...f, title, slug: newSlug };
        }
        return f;
      })
    );
  };

  const updateFileSlug = (id: string, slug: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, "") } : f))
    );
  };

  const updateFileDescription = (id: string, description: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description } : f))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRAG) {
      setGlobalMessage({
        type: "success",
        text: `Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? "s" : ""} to RAG storage!`,
      });
      setTimeout(() => router.push("/admin"), 1500);
      return;
    }

    if (!selectedCourseId) {
      setGlobalMessage({ type: "error", text: "Please select a course" });
      return;
    }

    const uploadedFiles = files.filter((f) => f.status === "uploaded" && f.fileUrl);
    if (uploadedFiles.length === 0) {
      setGlobalMessage({ type: "error", text: "No files ready to save" });
      return;
    }

    // Check for empty titles
    const emptyTitles = uploadedFiles.filter((f) => !f.title.trim());
    if (emptyTitles.length > 0) {
      setGlobalMessage({ type: "error", text: "Please enter titles for all files" });
      return;
    }

    setIsSaving(true);
    setGlobalMessage(null);

    let successCount = 0;
    let errorCount = 0;

    // Save each file to database
    for (const fileUpload of uploadedFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileUpload.id ? { ...f, status: "saving" } : f))
      );

      try {
        const response = await fetch("/api/admin/save-resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: selectedCourseId,
            title: fileUpload.title.trim(),
            slug: fileUpload.slug.trim(),
            description: fileUpload.description.trim(),
            type: fileUpload.type,
            fileUrl: fileUpload.fileUrl,
            status: selectedStatus,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id ? { ...f, status: "success", message: "Saved!" } : f
            )
          );
          successCount++;
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id ? { ...f, status: "error", message: result.message } : f
            )
          );
          errorCount++;
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id ? { ...f, status: "error", message: "Failed to save" } : f
          )
        );
        errorCount++;
      }
    }

    setIsSaving(false);

    if (errorCount === 0 && successCount > 0) {
      setGlobalMessage({
        type: "success",
        text: `Successfully saved ${successCount} resource${successCount > 1 ? "s" : ""}! Redirecting...`,
      });
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } else if (errorCount > 0) {
      setGlobalMessage({
        type: "error",
        text: `${successCount} saved, ${errorCount} failed. Check errors below.`,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const uploadedCount = files.filter((f) => f.status === "uploaded").length;
  const pendingOrUploadingCount = files.filter((f) => f.status === "pending" || f.status === "uploading").length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
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

      {/* RAG Dump Toggle */}
      <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/50 dark:bg-primary-900/10">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-300">
              RAG Storage Mode
            </h3>
            <p className="text-xs text-primary-700 dark:text-primary-400">
              Upload files as generic dumps for AI knowledge. These won&apos;t be visible in any course.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRAG(!isRAG);
              if (!isRAG) setSelectedCourseId(""); // Clear course if RAG is on
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isRAG ? "bg-primary-600" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isRAG ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Resource Type Info */}
      <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-900 dark:text-white">Supported file types:</span>{" "}
          Videos (MP4, WebM, MOV), Audio (MP3, WAV, OGG, M4A), PDFs — file type is auto-detected
        </p>
      </div>

      {/* Status Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Publish Status
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedStatus("published")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedStatus === "published"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
            }`}
          >
            <Check className="h-4 w-4" />
            Published
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("draft")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedStatus === "draft"
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
            }`}
          >
            <PencilLine className="h-4 w-4" />
            Draft
          </button>
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
            accept="video/*,audio/*,.pdf,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a"
            onChange={handleFileChange}
            multiple
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Choose files to upload"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <CloudUpload className="h-7 w-7 text-neutral-400" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                {selectedCourseId ? "Drag and drop files here" : "Select a course first"}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {selectedCourseId ? "or click to browse • Mixed file types allowed" : "Choose a course to enable uploads"}
              </p>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Videos, Audio, PDFs • Max 100MB per file
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
            {uploadedCount > 0 && (
              <span className="text-sm text-green-600 dark:text-green-400">
                {uploadedCount} ready to save
              </span>
            )}
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
                    : fileUpload.status === "uploading" || fileUpload.status === "saving"
                    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20"
                    : fileUpload.status === "uploaded"
                    ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                    : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-1 shrink-0">
                    {fileUpload.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : fileUpload.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : fileUpload.status === "uploaded" ? (
                      <CloudUpload className="h-5 w-5 text-green-500" />
                    ) : fileUpload.status === "uploading" || fileUpload.status === "saving" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <FileStack className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    {fileUpload.status === "uploaded" || fileUpload.status === "pending" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={fileUpload.title}
                            onChange={(e) => updateFileTitle(fileUpload.id, e.target.value)}
                            placeholder="Enter title..."
                            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                          />
                          <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                            fileUpload.type === "video"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : fileUpload.type === "audio"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {fileUpload.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-400">Slug:</span>
                          <input
                            type="text"
                            value={fileUpload.slug}
                            onChange={(e) => updateFileSlug(fileUpload.id, e.target.value)}
                            placeholder="url-slug"
                            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                          />
                        </div>
                        <textarea
                          value={fileUpload.description}
                          onChange={(e) => updateFileDescription(fileUpload.id, e.target.value)}
                          placeholder="Enter description (optional)..."
                          rows={2}
                          className="w-full resize-none rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-neutral-900 dark:text-white">
                            {fileUpload.title}
                          </p>
                          <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                            fileUpload.type === "video"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : fileUpload.type === "audio"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {fileUpload.type}
                          </span>
                        </div>
                        {fileUpload.description && (
                          <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-300">
                            {fileUpload.description}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
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
                    {(fileUpload.status === "uploading" || fileUpload.status === "pending") && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600 dark:text-blue-400">
                            {fileUpload.status === "uploading" ? "Uploading..." : "Waiting..."}
                          </span>
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

                    {fileUpload.status === "saving" && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Saving to database...</p>
                    )}
                  </div>

                  {/* Remove Button */}
                  {(fileUpload.status === "uploaded" || fileUpload.status === "error") && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileUpload.id)}
                      aria-label="Remove file"
                      className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        type="submit"
        disabled={isSaving || uploadedCount === 0 || pendingOrUploadingCount > 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : pendingOrUploadingCount > 0 ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading files...
          </>
        ) : (
          <>
            <Check className="h-5 w-5" />
            Save {uploadedCount > 0 ? `${uploadedCount} Resource${uploadedCount > 1 ? "s" : ""}` : "Resources"}
          </>
        )}
      </button>

      {/* Global Message */}
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
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="font-medium">{globalMessage.text}</p>
          </div>
        </div>
      )}
    </form>
  );
}
