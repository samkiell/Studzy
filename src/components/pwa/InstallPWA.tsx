"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import Image from "next/image";

export function InstallPWA() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user has already dismissed it in this session or recently
      const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!isDismissed) {
        // Delay showing the prompt a bit
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Track if app is already installed
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
    } else {
      console.log("User dismissed the PWA install");
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
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
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-5">
            {/* Icon Container - Matches screenshot style */}
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] bg-[#1e4d44] text-white">
              <Download className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1 pt-0.5 pr-6">
              <h3 className="text-[19px] font-bold text-neutral-900 dark:text-white leading-tight">Install Studzy</h3>
              <p className="mt-1 text-[14px] font-medium text-neutral-500 dark:text-neutral-400">
                Add Studzy to your home screen for quick access
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              onClick={handleInstall}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#2d6a4f] px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-[#2d6a4f]/20 transition-all hover:bg-[#1b4332] active:scale-[0.98]"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
