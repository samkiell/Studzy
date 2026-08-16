"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import type { ChatSession, ChatMessage } from "@/types/database";

interface ChatPageClientProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  user: {
    id: string;
    name: string;
    image?: string;
  };
  sessionTitle: string;
  sessions: ChatSession[];
}

export function ChatPageClient({
  sessionId,
  initialMessages,
  user,
  sessionTitle,
  sessions,
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
        const { session } = await res.json();
        router.push(`/studzyai/chat/${session.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/sessions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (id === sessionId) {
          router.push("/studzyai");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleSessionUpdate = () => {
    router.refresh();
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      <ChatPanel
        sessionId={sessionId}
        initialMessages={initialMessages}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSessionUpdate={handleSessionUpdate}
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
