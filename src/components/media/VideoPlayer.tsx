"use client";

import { useRef, useState, useCallback } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Share2, 
  Download, 
  Maximize2 as Expand, 
  Minimize2 as Minimize,
  Check
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  resourceId?: string;
  onComplete?: () => void;
}

export function VideoPlayer({ src, title, resourceId, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-black">
      {/* Studzy Watermark */}
      <div className="pointer-events-none absolute bottom-12 left-2 z-10 select-none sm:bottom-16 sm:left-4">
        <span className="text-sm font-bold text-white/40 drop-shadow-lg sm:text-lg">Studzy</span>
      </div>

      <video
        ref={videoRef}
        src={src}
        className="aspect-video w-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        title={title}
      />

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        {/* Progress Bar */}
        <div className="px-2 sm:px-4">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 p-2 sm:gap-4 sm:p-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 sm:h-10 sm:w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            )}
          </button>

          {/* Time */}
          <span className="text-xs text-white sm:text-sm">
            {formatTime(currentTime)}
            <span className="hidden xs:inline"> / {formatTime(duration)}</span>
          </span>

          <div className="flex-1" />

          {/* Volume - hidden on mobile */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={toggleMute}
              className="text-white transition-colors hover:text-white/80"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
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

          {/* Mute button on mobile only */}
          <button
            onClick={toggleMute}
            className="text-white transition-colors hover:text-white/80 sm:hidden"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={copyLink}
            className="relative text-white transition-colors hover:text-white/80"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </button>

          {/* Download */}
          <a
            href={src}
            download
            className="text-white transition-colors hover:text-white/80"
            title="Download video"
          >
            <Download className="h-5 w-5" />
          </a>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white transition-colors hover:text-white/80"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Expand className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110 sm:h-20 sm:w-20">
            <Play className="h-7 w-7 sm:h-10 sm:w-10 fill-current" />
          </div>
        </button>
      )}
    </div>
  );
}
