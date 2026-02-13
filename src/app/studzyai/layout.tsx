import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STUDZY AI — AI Workspace",
  description: "Your AI-powered study assistant workspace",
};

export default function StudzyAILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950">
      {children}
    </div>
  );
}
