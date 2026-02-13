"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudzyAIPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Setting up your workspace...
        </p>
      </div>
    </div>
  );
}
