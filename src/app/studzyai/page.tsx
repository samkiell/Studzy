import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudzyAIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the most recent chat session
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (sessions && sessions.length > 0) {
    redirect(`/studzyai/chat/${sessions[0].id}`);
  }

  // If no sessions exist, create a new one
  const { data: newSession } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      title: "New Chat"
    })
    .select()
    .single();

  if (newSession) {
    redirect(`/studzyai/chat/${newSession.id}`);
  }

  // Fallback (should essentially never render)
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}
