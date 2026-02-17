"use client";

import { Brain } from "lucide-react";

interface CBTUploadToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CBTUploadToggle({ enabled, onToggle }: CBTUploadToggleProps) {
  return (
    <div className={`rounded-lg border p-4 transition-all ${
      enabled 
        ? "border-primary-200 bg-primary-50 dark:border-primary-900/50 dark:bg-primary-900/10" 
        : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            enabled ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
          }`}>
            <Brain className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className={`text-sm font-semibold ${
              enabled ? "text-primary-900 dark:text-primary-300" : "text-neutral-900 dark:text-white"
            }`}>
              CBT Question Bank Mode
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Bulk upload questions via structured JSON for CBT sessions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? "bg-primary-600" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
