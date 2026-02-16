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
    const queryEmbedding = await embedText(question);
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: TOP_K,
      filter_course_code: courseCode || null,
      filter_level: level || null,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

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
    console.warn("[RAG] Context retrieval failed (continuing without):", err);
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
      const isLast = i === messages.length - 1;
      
      // If message has images, we use the vision content array format
      const msgImages = (msg as any).images || (msg.image ? [msg.image] : []);
      
      if (msgImages.length > 0) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            ...msgImages.map((url: string) => ({
              type: "image_url",
              image_url: { url }
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

    // 🎓 RAG: Search study materials for relevant context
    // Only do this for text-only messages (not image analysis)
    if (!hasImages && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (lastUserMessage) {
        console.log(`[RAG] Searching study materials for: "${lastUserMessage.content.substring(0, 60)}..."`);
        const ragContext = await getRAGContext(
          lastUserMessage.content,
          course_code,
          level
        );

        if (ragContext) {
          console.log("[RAG] ✅ Found relevant study material context");
          // Prepend as system message so the AI has study material context
          mistralMessages.unshift({
            role: "system",
            content: ragContext,
          });
        } else {
          console.log("[RAG] No relevant study materials found");
        }
      }
    }

    // 🚀 LOGIC FOR AGENT VS BASE MODEL
    // We "Force" the Agent ID if it exists and there are no images.
    // If there ARE images, we MUST use a vision model (like Pixtral) because
    // most agents are configured with text-only models and will error on vision content.
    const shouldUseAgent = MISTRAL_AI_AGENT_ID && !hasImages;
    console.log(`AI Request - Mode: ${mode}, Use Agent: ${shouldUseAgent}, Has Images: ${hasImages}`);

    if (shouldUseAgent) {
      try {
        const response = await client.agents.stream({
          agentId: MISTRAL_AI_AGENT_ID!,
          messages: mistralMessages,
        });
        return streamResponse(response);
      } catch (agentError: any) {
        console.error("Mistral Agent Error:", agentError);
        throw agentError;
      }
    } else {
      try {
        const model = hasImages ? "pixtral-large-latest" : "mistral-large-latest";
        const response = await client.chat.stream({
          model: model,
          messages: mistralMessages,
          temperature: mode === "code" ? 0.3 : 0.7,
        });
        return streamResponse(response);
      } catch (chatError: any) {
        console.error("Mistral Chat Error:", chatError);
        throw chatError;
      }
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
          // Some SDK versions or response types might wrap the chunk in a .data property
          const data = (chunk as any).data || chunk;
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
