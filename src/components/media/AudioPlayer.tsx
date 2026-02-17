"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadFile } from "@/lib/download";
import { Check, Download, Share2 } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title: string;
  resourceId?: string;
  onComplete?: () => void;
}

export function AudioPlayer({ src, title, resourceId, onComplete }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mark as complete when 90% listened
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
      console.error("Failed to mark audio complete:", err);
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

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadFile(src, `${title.replace(/\s+/g, "_")}.mp3`);
    setIsDownloading(false);
  };

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Mark complete at 90%
      const progress = audio.currentTime / audio.duration;
      if (progress >= 0.9 && !hasMarkedComplete) {
        markComplete();
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [hasMarkedComplete, markComplete]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only invoke if interaction is mainly with body or if container is focused
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      switch(e.code) {
        case "Space":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipBackward();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (audioRef.current) {
            const newVol = Math.min(1, audioRef.current.volume + 0.1);
            audioRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (audioRef.current) {
            const newVol = Math.max(0, audioRef.current.volume - 0.1);
            audioRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skipForward, skipBackward, toggleMute]); // Dependencies updated

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative rounded-xl border border-neutral-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-3 sm:p-6 dark:border-neutral-800 dark:from-purple-950/30 dark:to-indigo-950/30 outline-none focus:ring-2 focus:ring-purple-500"
      tabIndex={0}
    >
      {/* Studzy Watermark */}
      <div className="pointer-events-none absolute bottom-3 left-3 select-none sm:left-4">
        <span className="text-[10px] font-bold text-purple-300/60 dark:text-purple-700/60 sm:text-sm">Studzy</span>
      </div>

      {src ? (
        <audio 
          key={src}
          ref={audioRef} 
          src={src} 
          preload="metadata" 
          onError={() => {
            // Silently handle error to prevent Next.js crash overlay
            console.warn("Audio failed to load:", src);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-neutral-500 italic text-sm">
          No audio source provided
        </div>
      )}

      {/* Title */}
      <div className="mb-3 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 sm:h-16 sm:w-16">
          <svg
            className="h-5 w-5 text-purple-600 dark:text-purple-400 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-neutral-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Audio Lecture
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="absolute h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Backward */}
        <button
          onClick={skipBackward}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:h-10 sm:w-10"
          title="Skip back 10s (Left Arrow)"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:h-14 sm:w-14"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-6 w-6 pl-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={skipForward}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:h-10 sm:w-10"
          title="Skip forward 10s (Right Arrow)"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
          </svg>
        </button>
      </div>

      {/* Volume Control & Download */}
      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        {/* Volume - hidden on mobile */}
        <div className="hidden items-center gap-3 sm:flex">
          <button
            onClick={toggleMute}
            className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            title={isMuted ? "Unmute (M)" : "Mute (M)"}
          >
            {isMuted || volume === 0 ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-neutral-300 dark:bg-neutral-600 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 sm:px-4 ${isDownloading ? "opacity-70 cursor-wait" : ""}`}
            title="Download Audio"
          >
            <Download className={`h-4 w-4 ${isDownloading ? "animate-pulse" : ""}`} />
            <span className="hidden xs:inline">{isDownloading ? "Downloading..." : "Download"}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-lg bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 sm:px-4"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span className="hidden xs:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
