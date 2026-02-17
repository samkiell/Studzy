"use client";

import { Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 bg-white/50 py-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} Studzy. Built for <strong>DevCore&apos;23</strong> Pioneers.
            </p>
            <p className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
              Created with ⚡beans
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://www.tiktok.com/@dev.core.23?_r=1&_t=ZS-940LRWiewky" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              title="Follow us on TikTok"
            >
              <svg 
                className="h-5 w-5 transition-transform group-hover:scale-110" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14.99.13 2.02.77 2.82.72.8 1.81 1.25 2.86 1.23 1.25.01 2.5-.75 3.12-1.84.36-.6.48-1.29.47-1.98-.01-4.83.01-9.67-.01-14.5Z" />
              </svg>
              <span className="hidden text-sm font-medium md:inline">TikTok</span>
            </a>
            
            <a 
              href="https://www.instagram.com/dev.core.23?utm_source=qr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              title="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="hidden text-sm font-medium md:inline">Instagram</span>
            </a>
            
            <a 
              href="mailto:devcore.23.oau@gmail.com"
              className="group flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              title="Email us"
            >
              <Mail className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="hidden text-sm font-medium md:inline">Email</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
