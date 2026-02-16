"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Reply, User as UserIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

interface Discussion {
  id: string;
  resource_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles: Profile;
}

interface DiscussionPanelProps {
  resourceId: string;
}

export function DiscussionPanel({ resourceId }: DiscussionPanelProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiscussions = async () => {
    const res = await fetch(`/api/discussions?resourceId=${resourceId}`);
    if (res.ok) {
      const data = await res.json();
      setDiscussions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiscussions();
  }, [resourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        content,
        parentId: replyTo?.id || null
      }),
    });

    if (res.ok) {
      setContent("");
      setReplyTo(null);
      fetchDiscussions();
    }
    setIsSubmitting(false);
  };

  const rootDiscussions = discussions.filter(d => !d.parent_id);

  return (
    <div className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Discussion</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-1 text-xs dark:bg-neutral-800">
            <span className="text-neutral-600 dark:text-neutral-400">
              Replying to <span className="font-bold">@{replyTo.profiles.username}</span>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Cancel</button>
          </div>
        )}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="w-full rounded-xl border border-neutral-200 bg-white p-4 pb-12 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            rows={3}
          />
          <div className="absolute bottom-3 right-3">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="space-y-6">
          {rootDiscussions.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-8">No discussions yet. Be the first to ask!</p>
          ) : (
            rootDiscussions.map(discussion => (
              <DiscussionItem 
                key={discussion.id} 
                discussion={discussion} 
                allDiscussions={discussions}
                onReply={(d) => {
                  setReplyTo(d);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DiscussionItem({ discussion, allDiscussions, onReply }: { discussion: Discussion, allDiscussions: Discussion[], onReply: (d: Discussion) => void }) {
  const replies = allDiscussions.filter(d => d.parent_id === discussion.id);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
          {discussion.profiles.avatar_url ? (
            <img src={discussion.profiles.avatar_url} alt={discussion.profiles.username || ""} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {discussion.profiles.username || "Anonymous"}
            </span>
            <span className="text-[10px] text-neutral-500">
              {new Date(discussion.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300">
            <ReactMarkdown>{discussion.content}</ReactMarkdown>
          </div>
          <button 
            onClick={() => onReply(discussion)}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-primary-600"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-14 space-y-6 border-l-2 border-neutral-100 pl-6 dark:border-neutral-800">
          {replies.map(reply => (
            <DiscussionItem key={reply.id} discussion={reply} allDiscussions={allDiscussions} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
