import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { content, mode, image, enable_search } = body;

    if (!content && !image) {
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
        image_url: image || null,
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

    // Call Mistral AI
    const aiResponse = await callMistralAI(allMessages || [], mode, enable_search, image);

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
      // Still return the AI response even if saving fails
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

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You are STUDZY AI, an advanced academic assistant created by Samkiel (portfolio: https://samkiel.dev).

Your mission:
Help software engineering students at Obafemi Awolowo University (OAU) study smarter, revise faster, and pass exams confidently.

Personality:
- Funny but intelligent (uses light Pidgin/slang occasionally)
- Friendly and motivational
- Clear and structured
- Always "rude" in a funny, tough-love way (academic banter)
- Never overly verbose
- Uses bullet points and structured formatting
- Makes learning enjoyable

Example tone:
- “Omo this topic no hard like that 😄 make I break am down for you.”
- “Calm down, oau no go kill you, we go solve am step by step.”
- “Exam no fit jam you if you prepare like this.”

Capabilities:
- Text explanations
- Image analysis
- Academic search
- Code generation and debugging
- Flashcard creation
- Quiz generation
- Exam prediction
- Structured summaries

Response Rules:
1. Be concise but thorough.
2. Use headings and bullet points.
3. When explaining: Start simple, then go deeper if needed.
4. If student uploads image: Extract content accurately, convert to notes if needed.
5. If search mode enabled: Provide structured findings.
6. If coding: Explain logic clearly, provide clean formatted code.
7. Encourage the student lightly.

Never:
- Give harmful instructions
- Encourage cheating
- Provide full copyrighted books
- Be sarcastic in a negative way`;



interface DBMessage {
  role: string;
  content: string;
  image_url?: string | null;
}

async function callMistralAI(
  messages: DBMessage[],
  mode: string,
  enableSearch: boolean,
  image?: string
): Promise<string> {
  if (!MISTRAL_API_KEY) {
    return "Sorry, the AI service is not configured. Please contact the administrator.";
  }

  // Build Mistral messages
  const mistralMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [];

  let modeContext = "";
  switch (mode) {
    case "code":
      modeContext = "\n\n[Code Mode Active: Focus on providing clean, well-documented code with explanations.]";
      break;
    case "search":
      modeContext = "\n\n[Search Mode Active: Provide comprehensive, well-researched responses.]";
      break;
    case "image":
      modeContext = "\n\n[Image Mode Active: Analyze the provided image carefully.]";
      break;
  }

  if (enableSearch && mode !== "search") {
    modeContext += "\n[Search Enabled: Include relevant research in your response.]";
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLast = i === messages.length - 1;

    if (msg.role === "user") {
      if (msg.image_url) {
        mistralMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content + (isLast ? modeContext : "") },
            { type: "image_url", image_url: { url: msg.image_url } },
          ],
        });
      } else {
        mistralMessages.push({
          role: "user",
          content: msg.content + (isLast ? modeContext : ""),
        });
      }
    } else {
      mistralMessages.push({
        role: "assistant",
        content: msg.content,
      });
    }
  }

  let model = "mistral-large-latest";
  if (mode === "image" || image || messages.some((m) => m.image_url)) {
    model = "pixtral-large-latest";
  }

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: mistralMessages,
        temperature: mode === "code" ? 0.3 : 0.7,
        max_tokens: mode === "code" ? 4096 : 2048,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mistral API error:", error);
      return "Sorry, I encountered an error processing your request. Please try again.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Mistral API call error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}
