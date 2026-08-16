import { ChatPageClient } from "./client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema/chat";
import { eq, and, asc, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import type { ChatSession, ChatMessage } from "@/types/database";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch session details
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, sessionId),
        eq(chatSessions.user_id, user.id)
      )
    )
    .limit(1);

  if (!session) {
    notFound();
  }

  // Fetch initial messages
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.session_id, sessionId))
    .orderBy(asc(chatMessages.created_at));

  const initialMessages = messages.map((msg) => ({
    id: msg.id,
    session_id: msg.session_id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    created_at: msg.created_at ? new Date(msg.created_at).toISOString() : "",
    mode: msg.mode as any,
    image_url: msg.image_url,
  }));

  // Fetch all sessions for sidebar
  const userSessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.user_id, user.id))
    .orderBy(desc(chatSessions.updated_at));

  const formattedSessions = userSessions.map((s) => ({
    ...s,
    created_at: s.created_at ? new Date(s.created_at).toISOString() : "",
    updated_at: s.updated_at ? new Date(s.updated_at).toISOString() : "",
  }));

  return (
    <ChatPageClient 
      sessionId={sessionId}
      initialMessages={initialMessages as ChatMessage[]}
      user={{
        id: user.id,
        name: user.username || user.full_name || user.name || "User",
        image: user.avatar_url || user.image || undefined,
      }}
      sessionTitle={session.title}
      sessions={formattedSessions as unknown as ChatSession[]}
    />
  );
}
