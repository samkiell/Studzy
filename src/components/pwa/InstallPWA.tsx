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
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-start gap-5">
            {/* Logo Icon Container */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 p-3 shadow-lg shadow-indigo-500/20">
              <Download className="h-8 w-8 text-white" />
            </div>

            <div className="min-w-0 flex-1 pt-1 pr-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Install Studzy</h3>
              <p className="mt-1 text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Add Studzy to your home screen for quick access
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleInstall}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-3.5 text-base font-semibold text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
