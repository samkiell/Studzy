"use client";

import { useEffect } from "react";
import { initOfflineSync } from "@/lib/offline/syncManager";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initOfflineSync();
  }, []);

  return <>{children}</>;
}
