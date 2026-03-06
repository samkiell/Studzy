import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { embedText } from "@/lib/rag/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOP_K, SIMILARITY_THRESHOLD } from "@/lib/rag/config";

// Initialize Gemini
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key not configured");
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Search study material embeddings for context relevant to the user's question.
 */
async function getRAGContext(
  question: string,
  courseCode?: string,
  level?: string
): Promise<string | null> {
  // 🔴 TEMPORARILY DISABLED BY USER REQUEST (TOKENS SAVING)
  console.log(`[RAG] 🚫 RAG is temporarily disabled. Skipping context retrieval.`);
  return null;

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
1. START YOUR RESPONSE by acknowledging the materials found, but DO NOT show raw technical file paths. Instead, use descriptive terms if possible or just refer to them as "uploaded study materials".
2. Use the provided study materials to answer the student's question accurately.
3. If the study materials don't cover the topic, answer from your general knowledge.
4. Format responses with markdown for readability.`;
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
      const { error: userMsgError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: body.role || "user",
          content: content || "",
          mode: mode || "chat",
          image_url: finalImageUrl || null,
        });

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

    // 🚀 Call Gemini AI with streaming
    const genAI = getGeminiAI();
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = await callGeminiAIStream(
      genAI,
      allMessages || [], 
      mode, 
      enable_search || mode === "search", 
      !!(images && images.length > 0), 
      content,
      session.course_code,
      session.level
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
            await supabase.from("chat_messages").insert({
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
  hasImageRequest: boolean,
  latestUserContent?: string,
  courseCode?: string,
  level?: string
) {
  const geminiContents: { role: string; parts: Part[] }[] = messages.reverse().filter((msg, index, self) => 
    // Basic filter to ensure valid roles and map them
    msg.role === "user" || msg.role === "assistant"
  ).reverse().map((msg) => {
    const parts: Part[] = [];
    if (msg.image_url) {
      parts.push({ text: msg.content || "Analyze this image." });
      // In a real production app, we would fetch the image and send as base64
      // For now, we'll just include the context as text
      parts.push({ text: `[Context: Image provided at ${msg.image_url}]` });
    } else {
      parts.push({ text: msg.content });
    }
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts
    };
  });

  let systemPrompt = `You are Studzy AI, a helpful and knowledgeable study assistant for Nigerian university students.
You help with exam preparation, coursework, lecture notes, and general academic questions.
Guidelines:
1. Explain concepts clearly and concisely, using examples when helpful.
2. If it's an exam question, provide a well-structured answer.
3. Format your response with markdown for readability (headers, lists, bold, code blocks).
4. Be encouraging and supportive in your tone.
5. When you don't know something, say so honestly.
6. Keep responses focused and relevant to the student's question.\n\n`;

  if (latestUserContent) {
    const ragContext = await getRAGContext(latestUserContent, courseCode, level);
    if (ragContext) {
      systemPrompt += ragContext + "\n\n";
    }
  }

  if (mode === "search" || enableSearch) {
    systemPrompt += `SEARCH MODE ACTIVE. Provide findings clearly in markdown.\n\n`;
  }

  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt.trim()
  });

  return model.generateContentStream({
    contents: geminiContents,
  });
}
