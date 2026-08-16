"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function PWASplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Only run on client
    setMounted(true);

    // Check if session splash has already shown to keep subsequent in-app page transitions instant
    const hasShown = sessionStorage.getItem("studzy_splash_shown");
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Show on every cold launch in PWA standalone, or first visit per session
    if (hasShown && !isStandalone) {
      setShouldRender(false);
      return;
    }

    sessionStorage.setItem("studzy_splash_shown", "true");

    // Smooth dismiss sequence
    const dismissTimer = setTimeout(() => {
      setIsDismissing(true);
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Wait for fade-out transition
      return () => clearTimeout(removeTimer);
    }, 750); // Display time (minimal & fast)

    return () => clearTimeout(dismissTimer);
  }, []);

  if (!shouldRender || !mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] transition-all duration-500 ease-out select-none ${
        isDismissing ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-hidden="true"
    >
      {/* Subtle Premium Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-primary-600/20 via-indigo-500/10 to-transparent blur-[80px]" />
      </div>

      {/* Main Brand Icon & Typography */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Glowing Logo Frame */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary-500/20 via-indigo-500/20 to-primary-600/20 blur-lg animate-pulse" />
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-neutral-900/90 border border-white/10 shadow-2xl backdrop-blur-md flex items-center justify-center p-3.5">
            <Image
              src="/favicon.png"
              alt="Studzy"
              width={64}
              height={64}
              priority
              className="h-full w-full object-contain filter drop-shadow-md"
            />
          </div>
        </div>

        {/* Minimal Brand Title */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase font-mono">
            STUDZY
          </span>
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-80" />
        </div>
      </div>

      {/* Footer Minimal Tag */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center text-center">
        <span className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
          Department of Software Engineering
        </span>
      </div>
    </div>
  );
}
