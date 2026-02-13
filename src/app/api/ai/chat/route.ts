import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You are STUDZY AI, an advanced academic assistant created by Samkiel (https://samkiel.dev).

Your mission:
Help university students study smarter, revise faster, and pass exams confidently.

Personality:
- Funny but intelligent
- Occasionally uses light Nigerian Pidgin English naturally (not excessive)
- Friendly and motivational
- Clear and structured
- Not overly verbose
- Uses headings and bullet points
- Makes learning enjoyable

Example tone:
"Omo this topic no hard like that 😄 make I break am down for you."
"Calm down, we go solve am step by step."

Capabilities:
1. **Text Explanations** — Break down complex academic concepts
2. **Image Analysis** — Analyze diagrams, equations, screenshots
3. **Academic Search** — Provide well-researched, comprehensive answers
4. **Code Generation** — Write clean, well-commented code with explanations
5. **Flashcards** — Create flashcard-style content for revision
6. **Quiz Generation** — Generate practice quiz questions
7. **Structured Summaries** — Summarize topics with clear headings

Rules:
- Be structured. Use markdown formatting (headers, lists, code blocks).
- Be concise but thorough.
- If image provided → analyze clearly.
- If search enabled → provide structured findings with context.
- If coding → clean code blocks + explanation.
- For math: Use clear notation and step-by-step explanations.
- Encourage critical thinking rather than just giving answers.
- Never encourage cheating.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  mode: "chat" | "image" | "search" | "code";
  enable_search: boolean;
  enable_code: boolean;
  image?: string;
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
    const { messages, mode, enable_search, enable_code, image } = body;

    // Build the messages array for Mistral
    const mistralMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];

    // Add mode-specific context
    let modeContext = "";
    switch (mode) {
      case "code":
        modeContext = "\n\n[Code Mode Active: Focus on providing clean, well-documented code with explanations.]";
        break;
      case "search":
        modeContext = "\n\n[Search Mode Active: Provide comprehensive, well-researched responses.]";
        break;
      case "image":
        modeContext = "\n\n[Image Mode Active: Analyze the provided image carefully.]";
        break;
    }

    if (enable_search && mode !== "search") {
      modeContext += "\n[Search Enabled: Include relevant research in your response.]";
    }

    // Convert messages to Mistral format
    for (const msg of messages) {
      if (msg.role === "user") {
        if (msg.image) {
          mistralMessages.push({
            role: "user",
            content: [
              {
                type: "text",
                text: msg.content + modeContext,
              },
              {
                type: "image_url",
                image_url: {
                  url: msg.image,
                },
              },
            ],
          });
        } else {
          mistralMessages.push({
            role: "user",
            content: msg.content + (messages.indexOf(msg) === messages.length - 1 ? modeContext : ""),
          });
        }
      } else {
        mistralMessages.push({
          role: "assistant",
          content: msg.content,
        });
      }
    }

    // Select the appropriate model based on capabilities needed
    let model = "mistral-large-latest";
    if (mode === "image" || image) {
      model = "pixtral-large-latest"; // Vision-capable model
    }

    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: mistralMessages,
        temperature: mode === "code" ? 0.3 : 0.7,
        max_tokens: mode === "code" ? 4096 : 2048,
        top_p: 0.95,
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mistral API error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: response.status }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }
        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process lines in buffer
            const lines = buffer.split('\n');
            // Keep the last partial line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              
              if (trimmedLine === "data: [DONE]") {
                continue;
              }

              if (trimmedLine.startsWith("data: ")) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const data = JSON.parse(jsonStr);
                  const content = data.choices[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  console.error("Error parsing JSON chunk", e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream reading error", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error) {
    console.error("Error in AI chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
