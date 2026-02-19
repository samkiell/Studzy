"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import Image from "next/image";

export function InstallPWA() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    if (ios) {
      // iOS doesn't support 'beforeinstallprompt', so we show manual instructions
      const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!isDismissed) {
        setTimeout(() => setIsVisible(true), 3000);
      }
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!isDismissed) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-4 right-4 z-[9999] md:left-auto md:right-8 md:w-[480px]"
      >
        <div className="relative overflow-hidden rounded-[24px] border border-neutral-100 bg-white/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
          <button
            onClick={handleDismiss}
            className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-5">
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Download className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1 pt-0.5 pr-6">
              <h3 className="text-[19px] font-bold text-neutral-900 dark:text-white leading-tight">
                {isIOS ? "Add Studzy to Home Screen" : "Install Studzy"}
              </h3>
              <p className="mt-1 text-[14px] font-medium text-neutral-500 dark:text-neutral-400">
                {isIOS 
                  ? "Tap the Share icon below and select 'Add to Home Screen'" 
                  : "Add Studzy to your home screen for quick access"}
              </p>
            </div>
          </div>

          {!isIOS ? (
            <div className="mt-7 flex items-center justify-between">
              <button
                onClick={handleInstall}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 text-[16px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Not now
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-700">
                  <span className="text-xl">⎋</span>
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  1. Tap the <span className="font-bold">Share</span> button
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-700">
                  <span className="text-lg">+</span>
                </div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  2. Select <span className="font-bold">'Add to Home Screen'</span>
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="mt-2 w-full rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-900 dark:bg-neutral-800 dark:text-white"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
