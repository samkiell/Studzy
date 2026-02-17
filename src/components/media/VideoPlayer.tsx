"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Share2, 
  Download, 
  Maximize2 as Expand, 
  Minimize2 as Minimize,
  Check,
  RotateCcw,
  RotateCw
} from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadFile } from "@/lib/download";

interface VideoPlayerProps {
  src: string;
  title: string;
  resourceId?: string;
  onComplete?: () => void;
}

export function VideoPlayer({ src, title, resourceId, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  // Handle interaction to keep controls visible
  const handleInteraction = () => {
    resetControlsTimeout();
  };

  // Mark as complete when 90% watched
  const markComplete = useCallback(async () => {
    if (hasMarkedComplete || !resourceId) return;
    
    setHasMarkedComplete(true);
    try {
      await fetch("/api/mark-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      onComplete?.();
    } catch (err) {
      console.error("Failed to mark video complete:", err);
      setHasMarkedComplete(false);
    }
  }, [hasMarkedComplete, resourceId, onComplete]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;
    
    setIsDownloading(true);
    await downloadFile(src, `${title.replace(/\s+/g, "_")}.mp4`);
    setIsDownloading(false);
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimeout();
    }
  }, [isPlaying, resetControlsTimeout]);

  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      resetControlsTimeout();
    }
  }, [duration, resetControlsTimeout]);

  // Keyboard Shortcuts
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    resetControlsTimeout();
  }, [isMuted, resetControlsTimeout]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
      try {
        await (screen.orientation as any).lock?.("landscape");
      } catch {}
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
      try {
        screen.orientation?.unlock?.();
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video is focused or fullscreen, or generally focused on page body
      // But avoid interfering with inputs
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      // Check if container contains focus or just global listeners
      // For better UX, let's attach global listeners when video is visible/playing
      // or attach strictly to container when focused.
      // BUT for simplicity and standard player behavior, users expect Space to pause if they just clicked the video.
      // We'll rely on global listener but check context.
      
      switch(e.code) {
        case "Space":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
            resetControlsTimeout();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
            resetControlsTimeout();
          }
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seek, toggleFullscreen, toggleMute]); // Dependencies need to be stable or wrapped in useCallback

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Mark complete at 90%
      const progress = videoRef.current.currentTime / videoRef.current.duration;
      if (progress >= 0.9 && !hasMarkedComplete) {
        markComplete();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
    resetControlsTimeout();
  };


  // Touch / Click Handler
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement> | React.TouchEvent<HTMLVideoElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // Tap logic
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      const rect = (e.target as HTMLVideoElement).getBoundingClientRect();
      const x = "clientX" in e ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
      const relativeX = x - rect.left;
      const width = rect.width;

      if (relativeX < width * 0.3) {
        seek(-10);
      } else if (relativeX > width * 0.7) {
        seek(10);
      } else {
        togglePlay();
      }
      // Ensure controls are visible after double tap action
      resetControlsTimeout();
      lastTapRef.current = 0; 
    } else {
      // Single tap
      lastTapRef.current = now;
      setShowControls(prev => !prev);
    }
  };

  // Sync fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        try { screen.orientation?.unlock?.(); } catch {}
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      ref={containerRef}
      className="group relative overflow-hidden rounded-xl bg-black outline-none focus:ring-2 focus:ring-primary-500"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      tabIndex={0} // Make focusable for keyboard events
    >
      {/* Studzy Watermark */}
      <div className="pointer-events-none absolute bottom-12 left-2 z-10 select-none sm:bottom-16 sm:left-4">
        <span className="text-sm font-bold text-white/40 drop-shadow-lg sm:text-lg">Studzy</span>
      </div>

      <video
        ref={videoRef}
        src={src}
        className="aspect-video w-full cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        onClick={handleVideoClick}
        title={title}
        onError={(e) => {
          console.error("Video error:", e);
          setError("Failed to load video. The format may not be supported or the file is missing.");
          setIsPlaying(false);
        }}
      />

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-900/90 gap-3 text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Video Playback Error</p>
            <p className="mt-1 text-sm text-neutral-400">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
          >
            Refresh Player
          </button>
        </div>
      )}

      {/* Touch Action Indicators (visual feedback could be added here for double tap) */}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicking controls from toggling controls
      >
        {/* Progress Bar */}
        <div className="px-2 sm:px-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 hover:bg-white/50 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-2 p-2 sm:gap-4 sm:p-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 sm:h-10 sm:w-10 focus:outline-none focus:ring-2 focus:ring-white/50"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            )}
          </button>

          {/* Skip Buttons (Mobile/Desktop friendly) */}
          <button 
            onClick={() => seek(-10)}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
            title="Rewind 10s (Left Arrow)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button 
            onClick={() => seek(10)}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
            title="Forward 10s (Right Arrow)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Time */}
          <span className="text-xs text-white sm:text-sm font-mono">
            {formatTime(currentTime)}
            <span className="text-white/70"> / {formatTime(duration)}</span>
          </span>

          <div className="flex-1" />

          {/* Volume Group */}
          <div className="group/volume relative flex items-center">
            <button
              onClick={toggleMute}
              className="p-2 text-white transition-colors hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <div className="hidden sm:flex w-0 overflow-hidden transition-all duration-300 group-hover/volume:w-24 pl-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="relative p-2 text-white transition-colors hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
            title="Copy link to clipboard"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`p-2 text-white transition-colors hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg ${isDownloading ? "opacity-50 cursor-wait" : ""}`}
            title="Download video"
          >
            <Download className={`h-5 w-5 ${isDownloading ? "animate-pulse" : ""}`} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-white transition-colors hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Expand className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Center Play Button (when paused and controls visible) */}
      {!isPlaying && showControls && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
        >
          <div className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110 sm:h-20 sm:w-20 shadow-lg">
            <Play className="h-7 w-7 sm:h-10 sm:w-10 fill-current ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}
