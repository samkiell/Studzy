import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Mistral } from "@mistralai/mistralai";
import { embedText } from "@/lib/rag/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOP_K, SIMILARITY_THRESHOLD } from "@/lib/rag/config";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_AI_AGENT_ID = process.env.MISTRAL_AI_AGENT_ID;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

/**
 * Search study material embeddings for context relevant to the user's question.
 * Returns a system prompt with the context, or null if no relevant chunks found.
 */
async function getRAGContext(
  question: string,
  courseCode?: string,
  level?: string
): Promise<string | null> {
  try {
    console.log(`[RAG] 🔍 Querying embeddings for: "${question.substring(0, 100)}..."`);
    const queryEmbedding = await embedText(question);
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: TOP_K,
      filter_course_code: courseCode || null,
      filter_level: level || null,
    });

    if (error) {
      console.error("[RAG] ❌ RPC Error:", error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log("[RAG] ⚠️ No matching study materials found for this query.");
      return null;
    }

    console.log(`[RAG] ✅ Found ${data.length} relevant chunks:`);
    data.forEach((chunk: any, i: number) => {
      console.log(`   Source ${i + 1}: ${chunk.file_path} (similarity: ${(chunk.similarity * 100).toFixed(1)}%)`);
    });

    const contextBlocks = data
      .map(
        (chunk: any, i: number) =>
          `--- Source ${i + 1} (${chunk.file_path}, relevance: ${(chunk.similarity * 100).toFixed(1)}%) ---\n${chunk.content}`
      )
      .join("\n\n");

    return `RELEVANT STUDY MATERIALS FOUND:
${contextBlocks}

INSTRUCTIONS FOR USING STUDY MATERIALS:
- When the student's question relates to the study materials above, use them to provide accurate answers.
- Cite which source the information comes from when possible.
- If the study materials don't cover the topic, you may still answer from your general knowledge but mention that the answer is not from their uploaded materials.
- Format responses with markdown for readability.`;
  } catch (err) {
    console.error("[RAG] ❌ Context retrieval failed:", err);
    return null;
  }
}

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

    // 🚀 Call Mistral AI using the official SDK (with RAG context)
    const aiResponse = await callMistralAI(allMessages || [], mode, enable_search, image || (images && images.length > 0), content);

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
  hasImageRequest: boolean,
  latestUserContent?: string
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
            contentArray.push({ type: "image_url", imageUrl: { url } });
          });
        } catch (e) {
          contentArray.push({ type: "image_url", imageUrl: { url: msg.image_url } });
        }
      } else {
        contentArray.push({ type: "image_url", imageUrl: { url: msg.image_url } });
      }

      return { role: msg.role, content: contentArray };
    }
    return { role: msg.role, content: msg.content };
  });

  // 🎓 RAG: Search study materials for relevant context
  if (latestUserContent) {
    try {
      const ragContext = await getRAGContext(latestUserContent);

      if (ragContext) {
        mistralMessages.unshift({
          role: "system",
          content: ragContext,
        });
      }
    } catch (err) {
      console.warn("[RAG] Context search failed (continuing without):", err);
    }
  }

  // Force Agent Logic
  if (!MISTRAL_AI_AGENT_ID) {
    return "Error: Mistral AI Agent ID not configured in environment variables.";
  }

  try {
    // ✅ USE OFFICIAL SDK AGENTS ENDPOINT
    const response = await client.agents.complete({
      agentId: MISTRAL_AI_AGENT_ID,
      messages: mistralMessages,
    });
    return response.choices?.[0]?.message?.content?.toString() || "No response";
  } catch (agentError: any) {
    console.error("Mistral Agent Error:", agentError);
    return `Sorry, I encountered an error with the AI Agent: ${agentError.message}`;
  }
}
