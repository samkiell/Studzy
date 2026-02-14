"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/types/database";
import { Share2, Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { getURL } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${getURL()}course/${course.code}`;
    const success = await copyToClipboard(url);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group/card">
      <Link href={`/course/${course.code}`}>
        <div className="h-full rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {course.code}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-all hover:bg-primary-100 hover:text-primary-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
                title="Share Course"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <svg
                className="h-5 w-5 text-neutral-400 transition-transform group-hover/card:translate-x-1 group-hover/card:text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
          <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {course.description}
            </p>
          )}

          {copied && (
            <div className="absolute top-16 right-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="rounded bg-neutral-900 px-2 py-1 text-[10px] font-bold text-white shadow-xl dark:bg-white dark:text-neutral-900">
                LINK COPIED
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
