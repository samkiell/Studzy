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
  const [error, setError] = useState(false);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className={`relative flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 transition-all duration-300 ${isZoomed ? "p-0" : "p-4 sm:p-8"}`}>
          {!error ? (
            <img
              src={src}
              alt={title}
              className={`max-w-full rounded-lg shadow-lg transition-transform duration-300 ${isZoomed ? "max-h-[85vh] scale-100" : "max-h-[60vh] hover:scale-[1.02]"}`}
              onError={() => setError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <svg className="mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 1 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Failed to load image</p>
            </div>
          )}
          
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
