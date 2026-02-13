"use client";

import { StudzyAIButton } from "@/components/ai";

export function AIProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StudzyAIButton />
    </>
  );
}
