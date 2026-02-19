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

    // 🌍 Fallback: If no course-specific materials, search across the entire "RAG Bucket"
    if (!error && (!data || data.length === 0) && courseCode) {
      console.log(`[RAG] 🌍 Course search returned nothing. Retrying with Global wildcard scope...`);
      const { data: globalData, error: globalError } = await supabase.rpc("match_embeddings", {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: TOP_K,
        filter_course_code: null, // Global wildcard search
        filter_level: null,
      });

      if (!globalError && globalData && globalData.length > 0) {
        console.log(`[RAG] ✅ Success! Found ${globalData.length} materials in Global scope.`);
        return formatRAGPrompt(globalData);
      }
    }

    if (error) {
      console.error("[RAG] ❌ RPC Error:", error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log("[RAG] ⚠️ No matching study materials found in ANY scope.");
      return null;
    }

    console.log(`[RAG] ✅ Found ${data.length} relevant chunks:`);
    return formatRAGPrompt(data);
  } catch (err) {
    console.error("[RAG] ❌ Context retrieval failed:", err);
    return null;
  }
}

/**
 * Helper to format retrieval data into a system prompt.
 */
function formatRAGPrompt(data: any[]): string {
  const contextBlocks = data
    .map(
      (chunk: any, i: number) =>
        `--- Source ${i + 1} (${chunk.file_path}, relevance: ${(chunk.similarity * 100).toFixed(1)}%) ---\n${chunk.content}`
    )
    .join("\n\n");

  return `RELEVANT STUDY MATERIALS FOUND:
${contextBlocks}

INSTRUCTIONS FOR USING STUDY MATERIALS:
1. START YOUR RESPONSE by acknowledging the materials found, but DO NOT show raw technical file paths (e.g., avoid "pdf/12345.pdf"). Instead, use descriptive terms if possible or just refer to them as "uploaded study materials".
2. Use the provided study materials to answer the student's question accurately.
3. If the study materials don't cover the topic, answer from your general knowledge or search tools, but clarify what is and isn't from the uploaded materials.
4. Format responses with markdown for readability.
5. IMPORTANT: Do not output any technical tool-call JSON or internal markers like 'web_search' as text in your response.`;
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
    const { content, mode, image, images, enable_search, trigger_only } = body;
    
    // If multiple images are provided, join them or store as JSON string
    const finalImageUrl = images && images.length > 0 ? JSON.stringify(images) : image;

    if (!content && !finalImageUrl && !trigger_only) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    // Save user message (SKIP if trigger_only is true)
    if (!trigger_only) {
      const { data: userMsg, error: userMsgError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: body.role || "user",
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
    const stream = await callMistralAIStream(
      allMessages || [], 
      mode, 
      enable_search || mode === "search", 
      !!(images && images.length > 0), 
      content,
      session.course_code,
      session.level
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        try {
          let hasEmittedContent = false;
          let lastChar = '';
          let repeatCount = 0;

          for await (const chunk of stream) {
            const data = (chunk as any).data || chunk;
            const choice = data.choices?.[0];
            
            let content = "";
            const rawContent = choice?.delta?.content;
            
            // 1. Robust Content Extraction (Handles strings and multi-part content items)
            if (typeof rawContent === "string") {
              content = rawContent;
            } else if (Array.isArray(rawContent)) {
              content = rawContent
                .map(part => (typeof part === 'string' ? part : (part as any).text || ""))
                .join("");
            } else if (rawContent && typeof rawContent === "object") {
              content = (rawContent as any).text || "";
            }
            
            if (content) {
              // 2. Aggressive Filtering for Technical Debris
              const technicalNoiseRegex = /^(web_search|thought|{"query"|\[{"query"|.*tool_call.*)/i;
              if (technicalNoiseRegex.test(content.trim())) {
                console.log(`[API Session] 🧹 Filtered internal noise: ${content.substring(0, 50)}...`);
                continue; 
              }

              // 3. Repetitive Character Guard
              if (content === lastChar && content.length === 1 && !/[a-zA-Z0-9]/.test(content)) {
                repeatCount++;
                if (repeatCount > 5) continue; 
              } else {
                lastChar = content.length === 1 ? content : '';
                repeatCount = 0;
              }

              fullContent += content;
              hasEmittedContent = true;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                choices: [{ delta: { content } }]
              })}\n\n`));
            }

            // Handle tool calls privately
            const toolCalls = choice?.delta?.toolCalls || choice?.message?.toolCalls;
            if (toolCalls && toolCalls.length > 0) {
              if (!hasEmittedContent) {
                // Pulse pulse to keep stream alive
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  choices: [{ delta: { content: "" } }]
                })}\n\n`));
                hasEmittedContent = true;
              }
            }
          }

          // Mark as done
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

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

/**
 * Ensures all messages (especially assistant ones) are valid for Mistral API.
 */
function validateMessages(messages: any[]): any[] {
  return messages.filter((msg, index) => {
    if (msg.role !== "assistant") return true;

    const hasContent = msg.content && typeof msg.content === "string" && msg.content.trim().length > 0;
    const hasToolCalls = msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0;

    if (!hasContent && !hasToolCalls) {
      console.warn(`[API Session] 🧹 Removing invalid assistant message at index ${index}.`);
      return false;
    }

    return true;
  });
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
  latestUserContent?: string,
  courseCode?: string,
  level?: string
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
      const ragContext = await getRAGContext(latestUserContent, courseCode, level);
      if (ragContext) {
        mistralMessages.unshift({ role: "system", content: ragContext });
      } else {
        mistralMessages.unshift({
          role: "system",
          content: "Note: No specific study materials were found in the database. Please answer based on your general knowledge or available web search tools. If searching, explicitly tell the user.",
        });
      }
    } catch (err) {
      console.warn("[RAG] Context search failed:", err);
    }
  }

  if (mode === "search" || enableSearch) {
    mistralMessages.unshift({
      role: "system",
      content: `SEARCH MODE ACTIVE. 
CRITICAL INSTRUCTIONS:
1. Your tools (web_search) are internal. DO NOT output any technical log data, function names (like "web_search"), thought process markers, or raw JSON in your final answer.
2. If you find no relevant information, explain that normally without technical jargon.
3. Provide ONLY a clean, markdown-formatted final response for the student.
4. Stop immediately once the answer is complete. Avoid trailing dots or repetitive characters.`,
    });
  }

  if (!MISTRAL_AI_AGENT_ID) {
    throw new Error("Mistral Agent ID not configured");
  }

  const finalMessages = validateMessages(mistralMessages);

  // ✅ Always use the Agent API (handles search/tools automatically)
  return client.agents.stream({
    agentId: MISTRAL_AI_AGENT_ID,
    messages: finalMessages,
  });
}
