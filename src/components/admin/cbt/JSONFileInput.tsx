"use client";

import { useRef, useState, useEffect } from "react";
import { FileCode, Upload, X, ClipboardPaste, Code2 } from "lucide-react";

interface JSONFileInputProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function JSONFileInput({ file, onFileSelect, disabled }: JSONFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Compile JSON text into a File object
  const compileJsonToFile = (text: string, customName?: string): boolean => {
    try {
      const parsed = JSON.parse(text.trim());
      const formatted = JSON.stringify(parsed, null, 2);
      const filename = customName || `questions-${Date.now()}.json`;
      const compiledFile = new File([formatted], filename, {
        type: "application/json",
      });
      onFileSelect(compiledFile);
      setPasteError(null);
      setPastedJsonText("");
      setShowPasteModal(false);
      return true;
    } catch (err: any) {
      setPasteError(`Invalid JSON format: ${err.message}`);
      return false;
    }
  };

  // Handle paste events on window / dropzone
  const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
    if (disabled || file) return;

    // Check if pasted items include files
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      const pastedFile = e.clipboardData.files[0];
      if (pastedFile.name.endsWith(".json") || pastedFile.type === "application/json") {
        e.preventDefault();
        onFileSelect(pastedFile);
        return;
      }
    }

    // Check if pasted items contain raw text
    const text = e.clipboardData?.getData("text");
    if (text && text.trim().startsWith("{") || (text && text.trim().startsWith("["))) {
      e.preventDefault();
      compileJsonToFile(text);
    }
  };

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
      if (droppedFile.name.endsWith(".json") || droppedFile.type === "application/json") {
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
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          JSON File / CBT Questions <span className="text-red-500">*</span>
        </label>
        {!file && (
          <button
            type="button"
            onClick={() => setShowPasteModal(!showPasteModal)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            {showPasteModal ? "Cancel Paste" : "Paste JSON"}
          </button>
        )}
      </div>

      {showPasteModal && !file && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-950/20 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
              <Code2 className="h-4 w-4" />
              Paste JSON Data Below
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Will be compiled into a .json file
            </span>
          </div>

          <textarea
            value={pastedJsonText}
            onChange={(e) => {
              setPastedJsonText(e.target.value);
              setPasteError(null);
            }}
            placeholder='[ { "question_text": "...", "options": { "A": "..." }, "correct_option": "A" } ]'
            rows={5}
            className="w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          {pasteError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {pasteError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPasteModal(false);
                setPastedJsonText("");
                setPasteError(null);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!pastedJsonText.trim()}
              onClick={() => compileJsonToFile(pastedJsonText)}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Compile into File
            </button>
          </div>
        </div>
      )}

      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
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
              Click to upload, drag & drop, or paste JSON (Ctrl+V)
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              .json files and pasted JSON arrays accepted
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
