"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserPresence() {
  const supabase = createClient();

  useEffect(() => {
    const updatePresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update last_seen every 2 minutes when active
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", session.user.id);
    };

    // Initial update
    updatePresence();

    // Set up interval for subsequent updates
    const interval = setInterval(updatePresence, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [supabase]);

  return null;
}
