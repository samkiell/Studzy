"use client";

import { useState } from "react";
import { Maximize2, Download, ExternalLink } from "lucide-react";

interface ImageViewerProps {
  src: string;
  title: string;
  resourceId: string;
}

export function ImageViewer({ src, title }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className={`relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 transition-all duration-300 ${isZoomed ? "p-0" : "p-4 sm:p-8"}`}>
          <img
            src={src}
            alt={title}
            className={`max-w-full rounded-lg shadow-lg transition-transform duration-300 ${isZoomed ? "max-h-[85vh] scale-100" : "max-h-[60vh] hover:scale-[1.02]"}`}
          />
          
          {/* Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
            <span className="text-6xl font-black uppercase tracking-[2em] text-neutral-500 -rotate-12">
              Studzy
            </span>
          </div>
          
          {/* Controls Overlay */}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70"
              title={isZoomed ? "Shrink" : "Zoom In"}
            >
              <Maximize2 className={`h-5 w-5 ${isZoomed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
        {/* Studzy Watermark */}
        <div className="pointer-events-none absolute bottom-4 left-4 select-none">
          <span className="text-lg font-bold text-blue-400/50 drop-shadow-md">Studzy</span>
        </div>
          </div>
          <a
            href={src}
            download={title}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
