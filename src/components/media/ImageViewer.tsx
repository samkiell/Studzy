"use client";

import { useState } from "react";
import { Maximize2, Download, ExternalLink, Loader2 } from "lucide-react";

interface ImageViewerProps {
  src: string;
  title: string;
  resourceId: string;
}

export function ImageViewer({ src, title }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (error || isDownloading) return;
    setIsDownloading(true);

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          fallbackDownload();
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add Watermark
        ctx.save();
        
        // Large diagonal watermark
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        
        // Calculate font size based on image width
        const fontSize = Math.max(40, canvas.width / 10);
        ctx.font = `900 ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(115, 115, 115, 0.15)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = `${fontSize / 4}px`;
        ctx.fillText("STUDZY", 0, 0);
        
        ctx.restore();

        // Small bottom-left watermark
        ctx.font = `bold ${Math.max(20, canvas.width / 40)}px sans-serif`;
        ctx.fillStyle = "rgba(96, 165, 250, 0.5)"; // blue-400
        ctx.textAlign = "left";
        ctx.fillText("Studzy", Math.max(20, canvas.width * 0.02), canvas.height - Math.max(20, canvas.width * 0.02));

        // Trigger download
        canvas.toBlob((blob) => {
          if (!blob) {
            fallbackDownload();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          // Ensure it downloads as a file by appending extension if missing
          let filename = title || "studzy-image";
          if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
            filename += ".png";
          }
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        }, "image/png");
      };
      
      img.onerror = () => {
        fallbackDownload();
      };
      
      img.src = src;
    } catch (err) {
      console.error("Download failed", err);
      fallbackDownload();
    }
  };

  const fallbackDownload = () => {
    // fallback if CORS fails or canvas fails
    const a = document.createElement("a");
    a.href = src;
    a.download = title || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsDownloading(false);
  };

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
          <button
            onClick={handleDownload}
            disabled={isDownloading || error}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? "Processing..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
