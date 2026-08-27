"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAutoRefresh({ interval = 15000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return null;
}
