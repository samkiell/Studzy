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
        }
      }
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
    
    try {
      if (shouldUseWebSearch) {
        console.log("[API] 🌐 Search Mode Active: Calling mistral-large-latest with web_search: true");
        try {
          // Using mistral-large-latest which supports native web search
          const response = await client.chat.stream({
            model: "mistral-large-latest",
            messages: mistralMessages,
            web_search: true as any, 
          });
          return streamResponse(response);
        } catch (searchError: any) {
          console.error("[API] ❌ Search Mode Error:", searchError);
          // Fallback to regular agent if search fails
          console.log("[API] 🔄 Falling back to standard agent...");
        }
      }

      const response = await client.agents.stream({
        agentId: MISTRAL_AI_AGENT_ID,
        messages: mistralMessages,
      });
      return streamResponse(response);
    } catch (apiError: any) {
      console.error("[API] ❌ Mistral API failure:", apiError);
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
 * Helper to convert Mistral SDK stream to Next.js NextResponse
 */
async function streamResponse(response: any) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          // Robust chunk parsing for streaming
          const data = (chunk as any).data || chunk;
          
          // Mistral SDK can return deltas in different formats depending on the model/capability
          const content = data.choices?.[0]?.delta?.content || "";
          
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              choices: [{ delta: { content } }]
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
