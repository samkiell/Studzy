"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudzyAIPage() {
  const router = useRouter();

  useEffect(() => {
    // Create a new session and redirect
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
        } else {
          // If not authenticated, redirect to login
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }

    createAndRedirect();
  }, [router]);

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
