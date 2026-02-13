"use client";

import { useEffect } from "react";

interface TrackResourceViewProps {
  resourceId: string;
}

export function TrackResourceView({ resourceId }: TrackResourceViewProps) {
  useEffect(() => {
    // Track resource access
    fetch("/api/track-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    }).catch((err) => {
      console.error("Failed to track resource view:", err);
    });
  }, [resourceId]);

  return null;
}
