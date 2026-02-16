"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChatSidebar } from "@/components/ai/ChatSidebar";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { StudyTimeTracker } from "@/components/study/StudyTimeTracker";
import type { ChatSession, ChatMessage } from "@/types/database";

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
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

  useEffect(() => {
    if (!loading) return;

    const messages = [
      "Hacking into the school's databse",
      "Asking Thessy for answers",
      "Asking Thessy for the ‘answers’ she promised...",
      "Thessy saying ‘it’s easy’ after studying for 9 hours...",
      "Waiting for Dr. Gambo to approve this academically...",
      "Dr. Gambo adjusting the grading scale spiritually...",
      "Consulting Renowned’s emergency brain backup...",
      "Cambridge already solved it before the question loaded...",
      "Fatai explaining it in a way that confuses everyone more...",
      "Abhraham dropping ‘it’s common sense’ like we all live in his head...",
      "Pii protecting answers like it’s classified government data...",
      "Deamon revising while we’re still panicking...",
      "Robert zooming into Renowned’s screen with 4K vision...",
      "Thessy pretending not to know the answer again...",
      "Dr. Gambo increasing course units just because he can...",
      "Cambridge correcting the lecturer politely...",
      "Renowned calculating CGPA with calculator and prayer...",
      "Fatai forming a study group that turns into gist session...",
      "Abhraham unlocking hidden past questions archive...",
      "Pii saying ‘check the material’ like that helps...",
      "Deamon submitting before the timer even starts...",
      "Robert whispering ‘what did you get for number 3?’...",
      "Thessy upgrading from normal smart to exam hall monster...",
      "Dr. Gambo sensing academic dishonesty from 200 meters...",
    ];

    const pickRandom = () => messages[Math.floor(Math.random() * messages.length)];
    
    // Set initial message
    setCurrentLoadingMessage(pickRandom());

    const interval = setInterval(() => {
      setCurrentLoadingMessage(pickRandom());
    }, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="max-w-[280px] text-center text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {currentLoadingMessage}
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
      <StudyTimeTracker />
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
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
