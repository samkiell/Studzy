"use client";

import { useState, useRef, useEffect } from "react";
import { uploadResource } from "@/app/admin/actions";
import type { Course, ResourceType } from "@/types/database";

interface UploadFormProps {
  courses: Course[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FILE_TYPES: Record<ResourceType, { accept: string; label: string }> = {
  audio: { accept: "audio/*,.mp3,.wav,.ogg,.m4a", label: "Audio files (MP3, WAV, OGG, M4A)" },
  video: { accept: "video/*,.mp4,.webm,.mov", label: "Video files (MP4, WebM, MOV)" },
  pdf: { accept: ".pdf,application/pdf", label: "PDF documents" },
};

export function UploadForm({ courses }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedType, setSelectedType] = useState<ResourceType>("video");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Scroll to message when it appears
  useEffect(() => {
    if (message && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setMessage({
        type: "error",
        text: `File size exceeds 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });
      return;
    }
    setSelectedFile(file);
    setMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData(formRef.current!);
      if (selectedFile) {
        formData.set("file", selectedFile);
      }

      const result = await uploadResource(formData);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        formRef.current?.reset();
        setSelectedFile(null);
        setSelectedType("video");
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
          name="courseId"
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

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Resource Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          placeholder="e.g., Introduction to Software Engineering"
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
        />
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
                setSelectedFile(null);
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
        <input type="hidden" name="type" value={selectedType} />
      </div>

      {/* File Upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Upload File <span className="text-red-500">*</span>
        </label>
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : selectedFile
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
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
            name="file"
            accept={FILE_TYPES[selectedType].accept}
            onChange={handleFileChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-7 w-7 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove file
              </button>
            </div>
          ) : (
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
                  Drag and drop your file here
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {FILE_TYPES[selectedType].label} • Max 100MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Description <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Brief description of the resource content..."
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || !selectedFile}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
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
            Upload Resource
          </>
        )}
      </button>

      {/* Status Message - Below Button */}
      {message && (
        <div
          ref={messageRef}
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          <div className="flex items-start gap-3">
            {message.type === "success" ? (
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div className="flex-1">
              <p className="font-medium">{message.text}</p>
              {message.type === "error" && (
                <button
                  type="button"
                  onClick={() => setMessage(null)}
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
