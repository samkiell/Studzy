"use client";

import { useEffect, useRef } from "react";

interface StudyTimeTrackerProps {
  courseId?: string;
}

export function StudyTimeTracker({ courseId }: StudyTimeTrackerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Send heartbeat every 10 seconds
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/study/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
      } catch (err) {
        // Silently fail, heartbeat is low priority
      }
    };

    // Setup interval for subsequent heartbeats
    intervalRef.current = setInterval(sendHeartbeat, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null; // Invisible component
}
