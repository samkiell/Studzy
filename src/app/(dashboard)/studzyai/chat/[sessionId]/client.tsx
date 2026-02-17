"use client";

import { ChatPanel } from "@/components/ai/ChatPanel";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatMessage } from "@/types/database";

interface ChatPageClientProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  user: {
    id: string;
    name: string;
    image?: string;
  };
  sessionTitle: string;
}

export function ChatPageClient({ 
  sessionId, 
  initialMessages, 
  user,
  sessionTitle 
}: ChatPageClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(!sessionTitle.startsWith("Intro to Python"));

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/studzyai/chat/${data.session.id}`);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen w-full bg-white dark:bg-neutral-950">
      <ChatPanel 
        sessionId={sessionId}
        initialMessages={initialMessages}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSessionUpdate={() => {}} // Optional: handle title updates
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
