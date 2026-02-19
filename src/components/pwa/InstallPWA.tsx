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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] w-max max-w-[95vw]"
      >
        <div className="flex items-center gap-4 rounded-full border border-neutral-200/50 bg-white/90 p-2 pl-4 pr-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 shrink-0">
              <Download className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-neutral-900 dark:text-white leading-none">
                Install Studzy
              </span>
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                Have it as an App on your phone
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isIOS ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstall();
                }}
                className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                Install
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="rounded-full bg-neutral-100 px-4 py-2 text-[12px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Got it
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="group flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
