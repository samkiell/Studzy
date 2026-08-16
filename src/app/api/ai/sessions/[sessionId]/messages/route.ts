import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema/chat";
import { eq, and, asc } from "drizzle-orm";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Initialize Gemini
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key not configured");
  return new GoogleGenerativeAI(apiKey);
}

// POST /api/ai/sessions/[sessionId]/messages — save a message and get AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session ownership
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
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, mode, image, images, enable_search, trigger_only } = body;
    
    // If multiple images are provided, join them or store as JSON string
    const finalImageUrl = images && images.length > 0 ? JSON.stringify(images) : image;

    if (!content && !finalImageUrl && !trigger_only) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    // Save user message (SKIP if trigger_only is true)
    if (!trigger_only) {
      await db.insert(chatMessages).values({
        session_id: sessionId,
        role: body.role || "user",
        content: content || "",
        mode: mode || "chat",
        image_url: finalImageUrl || null,
      });
    }

    // Fetch all messages for context
    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.session_id, sessionId))
      .orderBy(asc(chatMessages.created_at));

    // Auto-generate title from first user message
    if (session.title === "New Chat" && content) {
      const autoTitle = content.length > 50 ? content.substring(0, 50) + "..." : content;
      await db
        .update(chatSessions)
        .set({ title: autoTitle, updated_at: new Date() })
        .where(eq(chatSessions.id, sessionId));
    } else {
      // Update session timestamp
      await db
        .update(chatSessions)
        .set({ updated_at: new Date() })
        .where(eq(chatSessions.id, sessionId));
    }

    // 🚀 Call Gemini AI with streaming
    const genAI = getGeminiAI();
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = await callGeminiAIStream(
      genAI,
      allMessages || [], 
      mode, 
      enable_search || mode === "search", 
      !!(images && images.length > 0)
    );

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              fullContent += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                choices: [{ delta: { content: text } }]
              })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

          // Save assistant message to DB after stream completes
          if (fullContent) {
            await db.insert(chatMessages).values({
              session_id: sessionId,
              role: "assistant",
              content: fullContent,
              mode: mode || "chat",
            });
          }
        } catch (err: any) {
          console.error("[Gemini Stream] Error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });
    
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}

interface DBMessage {
  role: string;
  content: string;
  image_url?: string | null;
}

async function callGeminiAIStream(
  client: GoogleGenerativeAI,
  messages: DBMessage[],
  mode: string,
  enableSearch: boolean,
  hasImageRequest: boolean
) {
  // Optimize: filter once and map roles
  const geminiContents = messages
    .filter(msg => msg.role === "user" || msg.role === "assistant")
    .map((msg) => {
      const parts: Part[] = [];
      if (msg.image_url) {
        parts.push({ text: msg.content || "Analyze this image." });
        parts.push({ text: `[Context: Image provided at ${msg.image_url}]` });
      } else {
        parts.push({ text: msg.content });
      }
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts
      };
    });

  let systemPrompt = `You are STUDZY AI, the official academic assistant for DevCore'23, created by Samkiel. studzy.me
Creator: Samkiel (200L SWE, OAU). Portfolio: 🔗 https://samkiel.dev

Mission: Help DevCore'23 students (200L SWE) study smarter.
- Tone: Friendly, sharp, Nigerian Gen Z vibe (light Pidgin ok).
- Scope: 200-level depth, SE focused, exam-aware.
- Rules: Be accurate, use clean structure, no em dashes, no "in simple terms".
- If unsure: "I don’t have enough verified information to answer that accurately."`;

  if (mode === "search" || enableSearch) {
    systemPrompt += `SEARCH MODE ACTIVE. Provide findings clearly in markdown.\n\n`;
  }

  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt.trim(),
  });

  return model.generateContentStream({
    contents: geminiContents,
  });
}
