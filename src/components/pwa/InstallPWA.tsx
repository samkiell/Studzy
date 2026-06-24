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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-[99999] sm:w-max sm:max-w-[90vw]"
      >
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 rounded-2xl border border-neutral-200/50 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-4 dark:border-white/10 dark:bg-neutral-900">
          {/* Dismiss X */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute top-2 right-2 sm:static flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full sm:rounded-xl transition-colors hover:bg-neutral-100 dark:hover:bg-white/10 shrink-0 sm:order-last"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 shrink-0">
              <Download className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-tight">
                Install Studzy
              </span>
              <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                Have it as an App on your phone
              </span>
            </div>
          </div>

          {!isIOS ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInstall();
              }}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20 shrink-0"
            >
              Install
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="w-full sm:w-auto rounded-xl bg-neutral-100 px-5 py-2.5 text-sm font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 shrink-0"
            >
              Got it
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
