import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/db/schema/chat";
import { eq, desc } from "drizzle-orm";

export default async function StudzyAIPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get the most recent chat session
  const sessions = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.user_id, user.id))
    .orderBy(desc(chatSessions.updated_at))
    .limit(1);

  if (sessions && sessions.length > 0) {
    redirect(`/studzyai/chat/${sessions[0].id}`);
  }

  // If no sessions exist, create a new one
  const [newSession] = await db
    .insert(chatSessions)
    .values({
      user_id: user.id,
      title: "New Chat",
    })
    .returning();

  if (newSession) {
    redirect(`/studzyai/chat/${newSession.id}`);
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}
