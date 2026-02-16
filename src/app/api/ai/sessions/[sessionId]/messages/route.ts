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

    // 🚀 Call Mistral AI with streaming
    const stream = await callMistralAIStream(allMessages || [], mode, enable_search || mode === "search", !!(images && images.length > 0), content);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        try {
          for await (const chunk of stream) {
            const data = (chunk as any).data || chunk;
            const choice = data.choices?.[0];
            const content = choice?.delta?.content || "";
            
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Save assistant message to DB after stream completes
          if (fullContent) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: fullContent,
              mode: mode || "chat",
            });
          }
        } catch (err) {
          console.error("Streaming error:", err);
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

async function callMistralAIStream(
  messages: DBMessage[],
  mode: string,
  enableSearch: boolean,
  hasImageRequest: boolean,
  latestUserContent?: string
): Promise<AsyncIterable<any>> {
  if (!MISTRAL_API_KEY) {
    throw new Error("Mistral API Key not configured");
  }

  const mistralMessages: any[] = messages.map((msg) => {
    if (msg.image_url) {
      const contentArray: any[] = [{ type: "text", text: msg.content }];
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

  if (latestUserContent) {
    try {
      const ragContext = await getRAGContext(latestUserContent);
      if (ragContext) {
        mistralMessages.unshift({ role: "system", content: ragContext });
      }
    } catch (err) {
      console.warn("[RAG] Context search failed:", err);
    }
  }

  if (mode === "search" || enableSearch) {
    mistralMessages.unshift({
      role: "system",
      content: "SEARCH MODE ACTIVE: You have access to web search tools. If the user's question requires up-to-date information or specific details, use your web search tool.",
    });
  }

  if (!MISTRAL_AI_AGENT_ID) {
    throw new Error("Mistral Agent ID not configured");
  }

  const shouldUseWebSearch = enableSearch || mode === "search";

  if (shouldUseWebSearch) {
    return (client.chat.stream as any)({
      model: "mistral-large-latest",
      messages: mistralMessages,
      web_search: true,
    });
  }

  return client.agents.stream({
    agentId: MISTRAL_AI_AGENT_ID,
    messages: mistralMessages,
  });
}
