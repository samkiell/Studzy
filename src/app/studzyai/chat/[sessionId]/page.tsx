"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import type { ChatSession, ChatMessage } from "@/types/database";

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/sessions");
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error("Failed to fetch sessions");
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  }, [router]);

  // Fetch current session messages
  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/ai/sessions/${sessionId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 404) {
          setError("Session not found");
          return;
        }
        throw new Error("Failed to fetch session");
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchSessions();
    fetchSession();
  }, [fetchSessions, fetchSession]);

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessions((prev) => [data.session, ...prev]);
        router.push(`/studzyai/chat/${data.session.id}`);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/sessions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));

        // If deleting current session, navigate to another or create new
        if (id === sessionId) {
          const remaining = sessions.filter((s) => s.id !== id);
          if (remaining.length > 0) {
            router.push(`/studzyai/chat/${remaining[0].id}`);
          } else {
            handleNewChat();
          }
        }
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleSessionUpdate = (title: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title, updated_at: new Date().toISOString() }
          : s
      )
    );
  };

  const getLoadingMessage = () => {
    const messages = [
      "Consulting the academic gods...",
      "Polishing your brain cells...",
      "Calculating how much coffee you need...",
      "Reading chapters you skipped...",
      "Converting tears into grades...",
      "Briefly becoming smarter...",
      "Studzing your study habits...",
      "Waking up the local university ghost...",
      "Asking ChatGPT for the answers... just kidding...",
      "Translating professor-speak into English...",
      "Loading 4.0 GPA personality...",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {getLoadingMessage()}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">{error}</p>
          <button
            onClick={handleNewChat}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Panel */}
      <ChatPanel
        sessionId={sessionId}
        initialMessages={messages}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSessionUpdate={handleSessionUpdate}
        onNewChat={handleNewChat}
      />
    </div>
  );
}
