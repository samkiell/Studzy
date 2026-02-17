import { ChatPageClient } from "./client";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch session details
  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Fetch initial messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const initialMessages = messages?.map(msg => ({
    id: msg.id,
    session_id: msg.session_id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    created_at: msg.created_at,
    mode: msg.mode as any,
    image_url: msg.image_url
  })) || [];

  // Fetch all sessions for sidebar
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <ChatPageClient 
      sessionId={sessionId}
      initialMessages={initialMessages}
      user={{
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
        image: user.user_metadata?.avatar_url
      }}
      sessionTitle={session.title}
      sessions={sessions || []}
    />
  );
}
