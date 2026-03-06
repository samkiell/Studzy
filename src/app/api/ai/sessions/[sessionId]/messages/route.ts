import { GoogleGenerativeAI, Part } from "@google/generative-ai";

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key not configured");
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Search study material embeddings for context relevant to the user's question.
 * Returns a system prompt with the context, or null if no relevant chunks found.
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

          // 🚀 Call Gemini AI with streaming
          const genAI = getGeminiAI();
          const response = await callGeminiAIStream(
            genAI,
            allMessages || [], 
            mode, 
            enable_search || mode === "search", 
            !!(images && images.length > 0), 
            content,
            session.course_code,
            session.level
          );

          for await (const chunk of response.stream) {
            const content = chunk.text();
            
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                choices: [{ delta: { content } }]
              })}\n\n`));
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
  } catch (error: any) {
    console.error("Messages POST error:", error);
    
    // Log full diagnostic info for Gemini SDK Errors
    console.error("[API Session] ❌ Diagnostic failure details:", error);

    // Handle Gemini Errors
    if (error.message?.includes("429")) {
      return NextResponse.json(
        { error: "I'm cooking beans, I can't answer now." },
        { status: 429 }
      );
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: "AI Service authentication failed. Please contact the administrator." },
        { status: error.statusCode }
      );
    }

    // Try to extract error message from SDK error body if available
    try {
      if (error.body) {
        const sdkErrorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        if (sdkErrorBody.message) {
          return NextResponse.json(
            { error: `AI Error: ${sdkErrorBody.message}` },
            { status: error.statusCode || 500 }
          );
        }
      }
    } catch (parseErr) {
      console.warn("Failed to parse SDK error body:", parseErr);
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * Ensures all messages (especially assistant ones) are valid for Mistral API.
 */
function validateMessages(messages: any[]): any[] {
  // 1. Filter out invalid messages
  const filtered = messages.filter((msg, index) => {
    if (msg.role !== "assistant") return true;

    const hasContent = (msg.content && typeof msg.content === "string" && msg.content.trim().length > 0) || 
                       (Array.isArray(msg.content) && msg.content.length > 0);
    const hasToolCalls = (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) ||
                         (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0);

    if (!hasContent && !hasToolCalls) {
      console.warn(`[API Session] 🧹 Removing invalid assistant message at index ${index}.`);
      return false;
    }

    return true;
  });

  // 2. Mistral CRITICAL: The last message must be from the 'user' (or tool).
  // If the conversation ends with an assistant message, we pop it because we are 
  // currently trying to generate a NEW assistant response.
  while (filtered.length > 0 && filtered[filtered.length - 1].role === "assistant") {
    console.warn(`[API Session] 🧹 Removing trailing assistant message to satisfy Mistral API constraints.`);
    filtered.pop();
  }

  return filtered;
}

interface DBMessage {
  role: string;
  content: string;
  image_url?: string | null;
}

async function callMistralAIStream(
  client: Mistral,
  messages: DBMessage[],
  mode: string,
  enableSearch: boolean,
  hasImageRequest: boolean,
  latestUserContent?: string,
  courseCode?: string,
  level?: string
): Promise<AsyncIterable<any>> {
  const agentId = process.env.MISTRAL_AI_AGENT_ID;
  if (!agentId) {
    throw new Error("Mistral Agent ID not configured");
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
CRITICAL:
1. Provide the SEARCH RESULTS immediately in clean markdown. 
2. Use lists, bold text, and headers to present the data clearly.
3. If specific links or sources are found, include them.
4. Synthesize a brief final summary after the results.
5. NEVER output technical code/JSON or label segments like "web_search".`,
    });
  }

  if (!agentId) {
    throw new Error("Mistral Agent ID not configured");
  }

  const finalMessages = validateMessages(mistralMessages);

  // 🖼️ Vision requests: Use pixtral model for image understanding
  if (hasImageRequest) {
    console.log("[AI] 🖼️ Vision — using pixtral-large-latest");
    return client.chat.stream({
      model: "pixtral-large-latest",
      messages: finalMessages,
    });
  }

  // ✅ Text-only: Use mistral-large for high-quality responses
  // Bypasses the "Built-in connectors" error by using the direct Chat API
  console.log("[AI] 💬 Text — using mistral-large-latest");
  return client.chat.stream({
    model: "mistral-large-latest",
    messages: finalMessages,
  });
}
