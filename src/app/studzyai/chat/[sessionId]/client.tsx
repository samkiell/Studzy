"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { createClient } from "@/lib/supabase/client";
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
  // Auto-hide sidebar if it's an "Intro to Python" explanation or similar context if desired,
  // but for now default to open or closed based on screen size (handled in Sidebar/Panel logic)
  // or user preference. Let's default to closed for explanation sessions if title starts with "Intro to Python"
  // as per previous requirement, otherwise open.
  const [sidebarOpen, setSidebarOpen] = useState(!sessionTitle.startsWith("Intro to Python"));

  const handleNewChat = async () => {
    const supabase = createClient();
    const { data: newSession, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: "New Chat",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create new session:", error);
      return;
    }

    router.push(`/studzyai/chat/${newSession.id}`);
    router.refresh();
  };

  const handleDeleteSession = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete session:", error);
      return;
    }

    if (id === sessionId) {
      router.push("/studzyai");
    }
    router.refresh();
  };

  const handleSessionUpdate = (title: string) => {
    // Optimistic update mechanism could go here, or just rely on router.refresh() from the panel
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
