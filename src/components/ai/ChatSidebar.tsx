"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import type { ChatSession } from "@/types/database";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onToggle,
  onNewChat,
  onDeleteSession,
}: ChatSidebarProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    onDeleteSession(id);
    setDeletingId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group sessions by date
  const groupSessions = () => {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const thisWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    sessions.forEach((s) => {
      const d = new Date(s.updated_at);
      if (d >= todayStart) today.push(s);
      else if (d >= yesterdayStart) yesterday.push(s);
      else if (d >= weekStart) thisWeek.push(s);
      else older.push(s);
    });

    return { today, yesterday, thisWeek, older };
  };

  const groups = groupSessions();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[280px] flex-col border-r border-neutral-200 bg-neutral-50 transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Image src="/favicon.png" alt="Studzy" width={20} height={20} />
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              STUDZY AI
            </span>
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 lg:hidden"
            title="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No chats yet
              </p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                Start a new conversation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.today.length > 0 && (
                <SessionGroup
                  label="Today"
                  sessions={groups.today}
                  activeSessionId={activeSessionId}
                  deletingId={deletingId}
                  onSelect={(id) => router.push(`/studzyai/chat/${id}`)}
                  onDelete={handleDelete}
                />
              )}
              {groups.yesterday.length > 0 && (
                <SessionGroup
                  label="Yesterday"
                  sessions={groups.yesterday}
                  activeSessionId={activeSessionId}
                  deletingId={deletingId}
                  onSelect={(id) => router.push(`/studzyai/chat/${id}`)}
                  onDelete={handleDelete}
                />
              )}
              {groups.thisWeek.length > 0 && (
                <SessionGroup
                  label="This Week"
                  sessions={groups.thisWeek}
                  activeSessionId={activeSessionId}
                  deletingId={deletingId}
                  onSelect={(id) => router.push(`/studzyai/chat/${id}`)}
                  onDelete={handleDelete}
                />
              )}
              {groups.older.length > 0 && (
                <SessionGroup
                  label="Older"
                  sessions={groups.older}
                  activeSessionId={activeSessionId}
                  deletingId={deletingId}
                  onSelect={(id) => router.push(`/studzyai/chat/${id}`)}
                  onDelete={handleDelete}
                />
              )}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </aside>
    </>
  );
}

// Session group sub-component
function SessionGroup({
  label,
  sessions,
  activeSessionId,
  deletingId,
  onSelect,
  onDelete,
}: {
  label: string;
  sessions: ChatSession[];
  activeSessionId: string;
  deletingId: string | null;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <div className="space-y-0.5">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              session.id === activeSessionId
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
            <span className="min-w-0 flex-1 truncate">{session.title}</span>
            <button
              onClick={(e) => onDelete(e, session.id)}
              className={`shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                deletingId === session.id ? "opacity-100" : ""
              } text-neutral-400 hover:bg-neutral-300 hover:text-red-500 dark:hover:bg-neutral-700`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
