"use client";

import { useEffect } from "react";

export function UserPresence() {
  useEffect(() => {
    const updatePresence = async () => {
      try {
        await fetch("/api/study/heartbeat", { method: "POST" });
      } catch (err) {
        // silent fail
      }
    };

    updatePresence();

    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
