"use client";

import { useRef, useState } from "react";
import { FileCode, Upload, X } from "lucide-react";

interface JSONFileInputProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function JSONFileInput({ file, onFileSelect, disabled }: JSONFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".json")) {
        onFileSelect(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        JSON File <span className="text-red-500">*</span>
      </label>
      
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
            disabled ? "opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-800" :
            dragActive ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 cursor-pointer" :
            "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 cursor-pointer"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Upload className="h-6 w-6 text-neutral-400" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Only .json files are accepted
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/30 p-4 dark:border-primary-900/30 dark:bg-primary-900/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
