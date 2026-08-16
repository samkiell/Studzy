"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import Image from "next/image";

export function InstallPWA() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const checkAndShowPrompt = async (showFn: () => void) => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
      if (isStandalone) return;

      if ("getInstalledRelatedApps" in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            return;
          }
        } catch (e) {
          console.error("Failed to check installed apps:", e);
        }
      }

      const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!isDismissed) {
        showFn();
      }
    };

    if (ios) {
      setTimeout(() => {
        checkAndShowPrompt(() => {
          setIsVisible(true);
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }, 3000);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      setTimeout(() => {
        checkAndShowPrompt(() => {
          setIsVisible(true);
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 200);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 200);
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 200);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-auto sm:max-w-md z-[9999] transition-all duration-300 ease-out ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-neutral-200/80 bg-white/95 backdrop-blur-md shadow-2xl p-3.5 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/30 shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-neutral-900 dark:text-white truncate leading-tight">
              Install Studzy
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate leading-tight mt-0.5">
              {isIOS ? "Tap Share then 'Add to Home Screen'" : "Fast access & offline study on your device"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isIOS ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInstall();
              }}
              className="rounded-xl bg-primary-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95 shadow-md shadow-primary-600/20"
            >
              Install
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="rounded-xl bg-neutral-100 px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Got it
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
