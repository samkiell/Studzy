import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

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
    const { messages, mode, enable_search, images } = body;

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

    // 🚀 LOGIC FOR AGENT VS BASE MODEL
    // We "Force" the Agent ID if it exists and there are no images.
    // If there ARE images, we MUST use a vision model (like Pixtral) because
    // most agents are configured with text-only models and will error on vision content.
    const shouldUseAgent = MISTRAL_AI_AGENT_ID && !hasImages;
    console.log(`AI Request - Mode: ${mode}, Use Agent: ${shouldUseAgent}, Has Images: ${hasImages}`);

    if (shouldUseAgent) {
      try {
        const response = await client.agents.complete({
          agentId: MISTRAL_AI_AGENT_ID!,
          messages: mistralMessages,
          stream: true,
        });
        return streamResponse(response);
      } catch (agentError: any) {
        console.error("Mistral Agent Error:", agentError);
        throw agentError;
      }
    } else {
      try {
        const model = hasImages ? "pixtral-large-latest" : "mistral-large-latest";
        const response = await client.chat.complete({
          model: model,
          messages: mistralMessages,
          stream: true,
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
          // The SDK returns the chunk directly, not inside a .data property
          const content = chunk.choices?.[0]?.delta?.content || "";
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
