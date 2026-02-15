import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Mistral } from "@mistralai/mistralai";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_AI_AGENT_ID = process.env.MISTRAL_AI_AGENT_ID;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

// POST /api/ai/sessions/[sessionId]/messages — save a message and get AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, mode, image, images, enable_search } = body;
    
    // If multiple images are provided, join them or store as JSON string
    const finalImageUrl = images && images.length > 0 ? JSON.stringify(images) : image;

    if (!content && !finalImageUrl) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    // Save user message
    const { data: userMsg, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: content || "",
        mode: mode || "chat",
        image_url: finalImageUrl || null,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // Fetch all messages for context
    const { data: allMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    // Auto-generate title from first user message
    if (session.title === "New Chat" && content) {
      const autoTitle = content.length > 50 ? content.substring(0, 50) + "..." : content;
      await supabase
        .from("chat_sessions")
        .update({ title: autoTitle, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    } else {
      // Update session timestamp
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // 🚀 Call Mistral AI using the official SDK
    const aiResponse = await callMistralAI(allMessages || [], mode, enable_search, image || (images && images.length > 0));

    // Save assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: aiResponse,
        mode: mode || "chat",
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error("Error saving assistant message:", assistantMsgError);
    }

    // Get updated session title
    const { data: updatedSession } = await supabase
      .from("chat_sessions")
      .select("title")
      .eq("id", sessionId)
      .single();

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      content: aiResponse,
      sessionTitle: updatedSession?.title || session.title,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface DBMessage {
  role: string;
  content: string;
  image_url?: string | null;
}

async function callMistralAI(
  messages: DBMessage[],
  mode: string,
  enableSearch: boolean,
  hasImageRequest: boolean
): Promise<string> {
  if (!MISTRAL_API_KEY) {
    return "Sorry, the AI service is not configured. Please contact the administrator.";
  }

  // Build Mistral messages
  const mistralMessages: any[] = messages.map((msg) => {
    if (msg.image_url) {
      const contentArray: any[] = [
        { type: "text", text: msg.content }
      ];

      if (msg.image_url.startsWith("[")) {
        try {
          const parsed = JSON.parse(msg.image_url);
          parsed.forEach((url: string) => {
            contentArray.push({ type: "image_url", image_url: { url } });
          });
        } catch (e) {
          contentArray.push({ type: "image_url", image_url: { url: msg.image_url } });
        }
      } else {
        contentArray.push({ type: "image_url", image_url: { url: msg.image_url } });
      }

      return { role: msg.role, content: contentArray };
    }
    return { role: msg.role, content: msg.content };
  });

  // Force Agent Logic
  const hasVisionContent = messages.some(m => m.image_url) || hasImageRequest;
  const shouldUseAgent = MISTRAL_AI_AGENT_ID && !hasVisionContent;

  try {
    if (shouldUseAgent) {
      // ✅ USE OFFICIAL SDK AGENTS ENDPOINT
      const response = await client.agents.complete({
        agentId: MISTRAL_AI_AGENT_ID!,
        messages: mistralMessages,
      });
      return response.choices?.[0]?.message?.content?.toString() || "No response";
    } else {
      // Fallback Vision/Standard
      const model = hasVisionContent ? "pixtral-large-latest" : "mistral-large-latest";
      const response = await client.chat.complete({
        model: model,
        messages: mistralMessages,
        temperature: mode === "code" ? 0.3 : 0.7,
      });
      return response.choices?.[0]?.message?.content?.toString() || "No response";
    }
  } catch (error: any) {
    console.error("Mistral API call error:", error);
    return `Sorry, I encountered an error: ${error.message}`;
  }
}
