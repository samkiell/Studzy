"use client";

import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { ChatSession, ChatMessage } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  sessions
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

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/ai/sessions/${id}`, { method: "DELETE" });
      router.refresh();
      if (id === sessionId) {
        router.push("/studzyai");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-white dark:bg-neutral-950 overflow-hidden relative">
      <ChatSidebar 
        sessions={sessions}
        activeSessionId={sessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
      <ChatPanel 
        sessionId={sessionId}
        initialMessages={initialMessages}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSessionUpdate={() => {}} 
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
