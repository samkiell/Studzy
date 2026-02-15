"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudzyAIPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    async function createAndRedirect() {
      try {
        const res = await fetch("/api/ai/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsDone(true);
          router.replace(`/studzyai/chat/${data.session.id}`);
        } else if (res.status === 401) {
          router.replace("/login");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to create session. Please try again.");
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    }

    createAndRedirect();
  }, [router]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 max-w-sm">
            {error}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isDone) return;

    const messages = [
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

    const pickRandom = () => messages[Math.floor(Math.random() * messages.length)];
    
    // Set initial message
    setCurrentLoadingMessage(pickRandom());

    const interval = setInterval(() => {
      setCurrentLoadingMessage(pickRandom());
    }, 3000);

    return () => clearInterval(interval);
  }, [isDone]);

  if (isDone && !error) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12 text-primary-600">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-400/20" />
          <div className="relative h-full w-full animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
        <p className="max-w-[280px] animate-pulse text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {currentLoadingMessage}
        </p>
      </div>
    </div>
  );
}
