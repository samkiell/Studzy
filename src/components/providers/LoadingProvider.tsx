"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LoadingContext = createContext<{
  isLoading: boolean;
  message: string;
  startLoading: () => void;
  stopLoading: () => void;
} | null>(null);

const MESSAGES = [
  "Hacking into the school's databse",
  "Asking Thessy for answers",
  "Asking Thessy for the ‘answers’ she promised...",
  "Thessy saying ‘it’s easy’ after studying for 9 hours...",
  "Waiting for Dr. Gambo to approve this academically...",
  "Dr. Gambo adjusting the grading scale spiritually...",
  "Consulting Renowned’s emergency brain backup...",
  "Cambridge already solved it before the question loaded...",
  "Fatai explaining it in a way that confuses everyone more...",
  "Abhraham dropping ‘it’s common sense’ like we all live in his head...",
  "Pii protecting answers like it’s classified government data...",
  "Deamon revising while we’re still panicking...",
  "Robert zooming into Renowned’s screen with 4K vision...",
  "Thessy pretending not to know the answer again...",
  "Dr. Gambo increasing course units just because he can...",
  "Cambridge correcting the lecturer politely...",
  "Renowned calculating CGPA with calculator and prayer...",
  "Fatai forming a study group that turns into gist session...",
  "Abhraham unlocking hidden past questions archive...",
  "Pii saying ‘check the material’ like that helps...",
  "Deamon submitting before the timer even starts...",
  "Robert whispering ‘what did you get for number 3?’...",
  "Thessy upgrading from normal smart to exam hall monster...",
  "Dr. Gambo sensing academic dishonesty from 200 meters...",
];

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const pathname = usePathname();

  const startLoading = () => {
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    setLoading(true);
  };

  const stopLoading = () => setLoading(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading: loading, message, startLoading, stopLoading }}>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            <p className="max-w-[280px] text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
