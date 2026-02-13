"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  resourceId: string;
}

export function ViewTracker({ resourceId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const trackView = async () => {
      try {
        await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });
      } catch (err) {
        console.error("Failed to track view:", err);
      }
    };

    // Track after a short delay to avoid counting accidental clicks
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [resourceId]);

  return null;
}
