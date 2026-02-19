import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { embedText } from "@/lib/rag/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOP_K, SIMILARITY_THRESHOLD } from "@/lib/rag/config";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_AI_AGENT_ID = process.env.MISTRAL_AI_AGENT_ID;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
  images?: string[];
}

interface ChatRequest {
  messages: ChatMessage[];
  mode: "chat" | "image" | "search" | "code";
  enable_search: boolean;
  enable_code: boolean;
  image?: string;
  images?: string[];
  course_code?: string;
  level?: string;
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
4. Format responses with markdown for readability.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: "Mistral API key not configured" },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { messages, mode, enable_search, images, course_code, level } = body;

    // Check if we have any images in the request or history
    const hasImages = (images && images.length > 0) || 
                      body.image || 
                      messages.some(m => m.image || (m as any).images?.length);

    // Convert messages to Mistral content format
    const mistralMessages: any[] = messages.map((msg, i) => {
      // If message has images, we use the vision content array format
      const msgImages = (msg as any).images || (msg.image ? [msg.image] : []);
      
      if (msgImages.length > 0) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content || "Analyze this image." },
            ...msgImages.map((url: string) => ({
              type: "image_url",
              imageUrl: { url }
            }))
          ]
        };
      }
      
      // Text only
      return {
        role: msg.role,
        content: msg.content
      };
    });

    // 🎓 RAG: Search study material embeddings for context relevant to the user's question.
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (lastUserMessage) {
        const ragContext = await getRAGContext(
          lastUserMessage.content,
          course_code,
          level
        );

        if (ragContext) {
          // Prepend as system message so the AI has study material context
          mistralMessages.unshift({
            role: "system",
            content: ragContext,
          });
        } else {
          // 💡 FALLBACK: Inform the AI that no local context was found so it answers normally
          mistralMessages.unshift({
            role: "system",
            content: "Note: No specific study materials were found in the database for this query. Please answer based on your general knowledge or available web search tools. If the user is asking about their course, mention that no materials for this specific query have been uploaded yet.",
          });
        }
      }
    }

    if (mode === "search" || enable_search) {
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

    // 🚀 LOGIC FOR AGENT
    // We strictly use the Agent ID from env, which handles both text and vision content.
    if (!MISTRAL_AI_AGENT_ID) {
      return NextResponse.json(
        { error: "Mistral AI Agent ID not configured" },
        { status: 500 }
      );
    }

    const shouldUseWebSearch = enable_search || mode === "search";
    console.log(`[API] AI Request - Mode: ${mode}, Has Images: ${hasImages}, WebSearch: ${shouldUseWebSearch}`);
    
    // 🛡️ SECURITY: Validate and filter messages before sending to API
    const finalMessages = validateMessages(mistralMessages);

    try {
      // ✅ Standard Agent Logic (Mistral Agents handle tool/search execution automatically)
      const response = await client.agents.stream({
        agentId: MISTRAL_AI_AGENT_ID,
        messages: finalMessages,
        maxTokens: 2048, // Increase token limit for longer explanations
      });
      return streamResponse(response, mode, shouldUseWebSearch);
    } catch (apiError: any) {
      console.error("[API] ❌ Mistral failure:", apiError);
      return NextResponse.json(
        { error: `Mistral API Error: ${apiError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Total AI API Failure:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Ensures all messages (especially assistant ones) are valid for Mistral API.
 * Mistral requires assistant messages to have EITHER content OR tool_calls.
 */
function validateMessages(messages: any[]): any[] {
  return messages.filter((msg, index) => {
    if (msg.role !== "assistant") return true;

    const hasContent = (msg.content && typeof msg.content === "string" && msg.content.trim().length > 0) || 
                       (Array.isArray(msg.content) && msg.content.length > 0);
    const hasToolCalls = (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) ||
                         (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0);

    if (!hasContent && !hasToolCalls) {
      console.warn(`[API] 🧹 Removing invalid assistant message at index ${index}: No content and no tool_calls.`);
      return false;
    }

    return true;
  });
}

/**
 * Helper to convert Mistral SDK stream to Next.js NextResponse
 */
async function streamResponse(response: any, mode: string, isSearch: boolean = false) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let hasEmittedContent = false;
        let lastChar = '';
        let repeatCount = 0;

        // 🌐 Connection keep-alive: Send an invisible pulse to prevent timeout during search
        if (isSearch) {
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({
               choices: [{ delta: { content: "" } }] 
             })}\n\n`));
        }

        for await (const chunk of response) {
          const data = (chunk as any).data || chunk;
          const choice = data.choices?.[0];
          
          let content = "";
          const rawContent = choice?.delta?.content;
          
          // 1. Robust Content Extraction (Handles strings and multi-part content items)
          if (typeof rawContent === "string") {
            content = rawContent;
          } else if (Array.isArray(rawContent)) {
            // Handle array of content items (multipart)
            content = rawContent
              .map(part => (typeof part === 'string' ? part : (part as any).text || ""))
              .join("");
          } else if (rawContent && typeof rawContent === "object") {
            content = (rawContent as any).text || "";
          }
          
          if (content) {
            // 2. Surgical Filtering for Technical Debris
            const trimmed = content.trim();
            const isPureNoise = /^(\s*web_search\s*$|^thought\s*$|^\s*\{"query"|^\s*\[\s*\{"query")/i.test(trimmed);
            if (isPureNoise && trimmed.length < 50) {
              console.log(`[API] 🧹 Filtered internal noise: "${content.substring(0, 50)}"`);
              continue; 
            }

            // 3. Repetitive Character Guard
            if (content === lastChar && content.length === 1 && !/[a-zA-Z0-9]/.test(content)) {
              repeatCount++;
              if (repeatCount > 10) continue; // Trapping dots/loops
            } else {
              lastChar = content.length === 1 ? content : '';
              repeatCount = 0;
            }

            hasEmittedContent = true;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content } }]
            })}\n\n`));
          }

          // Handle tool calls privately
          const toolCalls = choice?.delta?.tool_calls || choice?.delta?.toolCalls || 
                          choice?.message?.tool_calls || choice?.message?.toolCalls;
          
          if (data.choices?.[0]?.finish_reason) {
            console.log(`[API] 🏁 Stream finished. Reason: ${data.choices[0].finish_reason}`);
          }

          if (toolCalls && toolCalls.length > 0) {
            // Always pulse on tool calls to keep connection alive
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content: "" } }]
            })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
