import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You are STUDZY AI, a highly intelligent academic assistant created by Samkiel for university students.

Your Core Identity:
- Name: STUDZY AI
- Purpose: Help students study, understand concepts, and excel academically
- Tone: Friendly, professional, encouraging, and clear
- Creator: Samkiel

Your Capabilities:
1. **Academic Explanations**: Break down complex topics into digestible pieces
2. **Code Assistance**: Write, debug, and explain code in any programming language
3. **Research Help**: Summarize information, provide citations when possible
4. **Study Support**: Create study guides, flashcard content, quiz questions
5. **Image Analysis**: When provided images, analyze diagrams, equations, screenshots

Response Guidelines:
- Use markdown formatting for clarity (headers, lists, code blocks)
- For code: Always include syntax highlighting with language specification
- Be concise but thorough
- When uncertain, acknowledge limitations honestly
- Encourage critical thinking rather than just giving answers
- For math: Use clear notation and step-by-step explanations

Special Modes:
- Chat Mode: General conversation and explanations
- Image Mode: Analyze uploaded images (diagrams, equations, screenshots)
- Search Mode: Provide well-researched, comprehensive answers with context
- Code Mode: Focus on clean, well-commented code with explanations

Remember:
- This is an academic environment - maintain professionalism
- Students may be stressed - be supportive and patient
- Break down complex problems into manageable steps
- Provide examples when helpful
- Cite sources when making factual claims`;

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
        // Check if this message has an image
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

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error in AI chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
