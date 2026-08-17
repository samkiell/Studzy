"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadFile } from "@/lib/download";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Check,
  Download,
  Share2,
  Loader2,
  Sun,
  Moon,
  Maximize,
} from "lucide-react";

interface PDFViewerProps {
  src: string;
  title: string;
  resourceId?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export function PDFViewer({
  src,
  title,
  resourceId,
  isCompleted = false,
  onComplete,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMarking, setIsMarking] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(isCompleted);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>("1");

  // Load PDF Document via PDF.js
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);

        const pdfjsLib = await import("pdfjs-dist");
        // Use CDN worker matching installed version
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({
          url: src,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setPageInput("1");
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF loading error:", err);
          setError(err.message || "Failed to load PDF");
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  // Render individual page to canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setIsRendering(true);

        // Cancel previous render task if still in progress
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setIsRendering(false);
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
          setIsRendering(false);
        }
      }
    },
    [pdfDoc, scale, rotation]
  );

  // Trigger render whenever document, current page, scale, or rotation changes
  useEffect(() => {
    if (pdfDoc && currentPage > 0 && currentPage <= totalPages) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, renderPage, totalPages]);

  // Navigation handlers
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => {
        const next = prev - 1;
        setPageInput(next.toString());
        return next;
      });
    }
  }, [currentPage]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => {
        const next = prev + 1;
        setPageInput(next.toString());
        return next;
      });
    }
  }, [currentPage, totalPages]);

  const handlePageInputCommit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setCurrentPage(parsed);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const zoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)));
  const resetZoom = () => setScale(1.2);
  const rotateClockwise = () => setRotation((r) => (r + 90) % 360);
  const toggleNightMode = () => setNightMode((n) => !n);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Keyboard Shortcuts for PDF reading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        rotateClockwise();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage]);

  // Mark completion
  const markAsDone = async () => {
    if (!resourceId || isMarking || completed) return;
    setIsMarking(true);
    try {
      await fetch("/api/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      setCompleted(true);
      onComplete?.();
    } catch (err) {
      console.error("Failed to mark PDF complete:", err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadFile(src, `${title.replace(/\s+/g, "_")}.pdf`);
    setIsDownloading(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl border border-neutral-200/80 bg-neutral-900 shadow-2xl overflow-hidden dark:border-neutral-800 ${
        isFullscreen ? "fixed inset-0 z-[99999] rounded-none border-none h-screen w-screen" : "min-h-[600px] h-[82vh]"
      }`}
    >
      {/* Top Custom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-neutral-950/90 backdrop-blur-md px-4 py-3 text-white z-20 shrink-0">
        {/* Title & Document Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400 border border-primary-500/30 shrink-0">
            <svg
              className="h-4 w-4"
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
          </div>
          <span className="truncate text-sm font-semibold text-neutral-100 max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
        </div>

        {/* Center Page Controls */}
        {totalPages > 0 && (
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-xl px-2 py-1 shadow-inner">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
              title="Previous Page (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <form onSubmit={handlePageInputCommit} className="flex items-center gap-1">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageInputCommit}
                className="w-10 text-center text-xs font-mono font-bold bg-neutral-800 border border-white/10 rounded-md py-0.5 text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-xs font-mono text-neutral-400">/ {totalPages}</span>
            </form>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
              title="Next Page (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={zoomOut}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 py-1 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="Reset Zoom (0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={rotateClockwise}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            title="Rotate Clockwise (R)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Night Mode Invert */}
          <button
            onClick={toggleNightMode}
            className={`p-2 rounded-xl transition-colors ${
              nightMode
                ? "bg-primary-600/30 text-primary-400 border border-primary-500/40"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title={nightMode ? "Normal Mode" : "Night Reading Mode"}
          >
            {nightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode (F)"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Mark Done */}
          {resourceId && (
            <button
              onClick={markAsDone}
              disabled={isMarking || completed}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                completed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-600/20"
              }`}
            >
              {completed ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Completed</span>
                </>
              ) : isMarking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden md:inline">Marking...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Mark Done</span>
                </>
              )}
            </button>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary-500 active:scale-95 shadow-md shadow-primary-600/20"
            title="Download PDF"
          >
            <Download className={`h-3.5 w-3.5 ${isDownloading ? "animate-pulse" : ""}`} />
            <span className="hidden md:inline">{isDownloading ? "..." : "Download"}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            title="Copy Link"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main PDF Canvas Workspace */}
      <div className="relative flex-1 overflow-auto bg-[#18181b] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950/80 backdrop-blur-sm z-30">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            <span className="text-sm font-medium text-neutral-300">Loading document pages...</span>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-neutral-950/90 z-30">
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-base">Unable to render PDF document</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                The PDF stream might be loading or protected. You can still download the complete file directly.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="mt-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-primary-500"
            >
              Download PDF File
            </button>
          </div>
        )}

        {/* Rendering Overlay */}
        {isRendering && !isLoading && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-400 backdrop-blur-sm border border-white/5">
            <Loader2 className="h-3 w-3 animate-spin text-primary-400" />
            <span>Rendering...</span>
          </div>
        )}

        {/* High-Res Canvas Page Render */}
        <div
          className={`relative transition-transform duration-200 shadow-2xl rounded-sm ${
            nightMode ? "filter invert contrast-125 hue-rotate-180 brightness-90" : ""
          }`}
        >
          <canvas ref={canvasRef} className="block rounded-sm bg-white shadow-2xl" />
        </div>
      </div>

      {/* Floating Bottom Quick Controls for Mobile / Comfort */}
      {totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-neutral-950/80 border border-white/10 px-3 py-1.5 backdrop-blur-md shadow-2xl">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 transition-colors px-2 py-1 rounded-md"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>
          <span className="text-xs font-mono font-bold text-primary-400 px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 transition-colors px-2 py-1 rounded-md"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
