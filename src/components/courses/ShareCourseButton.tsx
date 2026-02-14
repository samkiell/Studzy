"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copyToClipboard } from "@/lib/clipboard";
import { getURL } from "@/lib/utils";

interface ShareCourseButtonProps {
  courseCode: string;
}

export function ShareCourseButton({ courseCode }: ShareCourseButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${getURL()}course/${courseCode}`;
    const success = await copyToClipboard(url);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={handleShare}
        className="flex items-center gap-2"
        size="sm"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span>Share Course</span>
          </>
        )}
      </Button>
      
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded bg-neutral-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-xl dark:bg-white dark:text-neutral-900 whitespace-nowrap">
            SHARE LINK COPIED
          </div>
        </div>
      )}
    </div>
  );
}
