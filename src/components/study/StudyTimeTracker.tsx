"use client";

import { useEffect, useRef } from "react";

export function StudyTimeTracker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Send heartbeat every 10 seconds
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/study/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        // Silently fail, heartbeat is low priority
      }
    };

    // Initial heartbeat after 5 seconds to ensure user is actually reading
    const initialTimer = setTimeout(sendHeartbeat, 5000);

    // Setup interval for subsequent heartbeats
    intervalRef.current = setInterval(sendHeartbeat, 10000);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null; // Invisible component
}
