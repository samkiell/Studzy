"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function PWASplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Only show on standalone PWA cold launch once per session to avoid jarring browser flashes
    if (!isStandalone) {
      return;
    }

    const hasShown = sessionStorage.getItem("studzy_pwa_splash_shown");
    if (hasShown) {
      return;
    }

    sessionStorage.setItem("studzy_pwa_splash_shown", "true");
    setShouldRender(true);

    const dismissTimer = setTimeout(() => {
      setIsDismissing(true);
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 400);
      return () => clearTimeout(removeTimer);
    }, 600);

    return () => clearTimeout(dismissTimer);
  }, []);

  if (!mounted || !shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] transition-opacity duration-400 ease-out select-none pointer-events-none ${
        isDismissing ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Subtle Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary-600/15 blur-[90px]" />
      </div>

      {/* Main Brand Frame */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center p-3">
            <Image
              src="/favicon.png"
              alt="Studzy"
              width={56}
              height={56}
              priority
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg sm:text-xl font-black tracking-[0.2em] text-white uppercase font-mono">
            STUDZY
          </span>
          <span className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase">
            OAU Software Engineering
          </span>
        </div>
      </div>
    </div>
  );
}
