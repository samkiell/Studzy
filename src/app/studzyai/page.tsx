"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/providers/LoadingProvider";

export default function StudzyAIPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const [isDone, setIsDone] = useState(false);

  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    async function createAndRedirect() {
      startLoading();
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
          stopLoading();
          router.replace("/login");
        } else {
          stopLoading();
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to create session. Please try again.");
        }
      } catch {
        stopLoading();
        setError("Network error. Please check your connection and try again.");
      }
    }

    createAndRedirect();
  }, [router, startLoading, stopLoading]);

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

  return null;
}
