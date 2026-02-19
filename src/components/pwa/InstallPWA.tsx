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
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-max"
      >
        <div className="flex items-center gap-3 rounded-full border border-neutral-200/50 bg-white/80 p-1.5 pl-3 pr-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-900 dark:text-white leading-none">
                Install Studzy
              </span>
              <span className="text-[8px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight">
                For quick access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isIOS ? (
              <button
                onClick={handleInstall}
                className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                Install
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Got it
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="group flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-white/10"
            >
              <X className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
