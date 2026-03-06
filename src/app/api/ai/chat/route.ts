import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { embedText } from "@/lib/rag/embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOP_K, SIMILARITY_THRESHOLD } from "@/lib/rag/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

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
  // 🔴 TEMPORARILY DISABLED BY USER REQUEST (TOKENS SAVING)
  console.log(`[RAG] 🚫 RAG is temporarily disabled in chat route.`);
  return null;

  try {
    console.log(`[RAG] 🔍 Querying embeddings for: "${question.substring(0, 100)}..."`);
    const queryEmbedding = await embedText(question);
    const supabase = createAdminClient();

    console.log(`[RAG] 🔍 RPC Match Embeddings - Threshold: ${SIMILARITY_THRESHOLD}, Count: ${TOP_K}, Course: ${courseCode}, Level: ${level}`);
    
    // NOTE: Some PGVector implementations expect query_embedding as a raw array, not stringified.
    // We pass it as-is (array) which Supabase-JS handles.
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: queryEmbedding, 
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: TOP_K,
      filter_course_code: courseCode || null,
      filter_level: level || null,
    });
    
    // 🌍 Fallback: If no course-specific materials, search across the entire "RAG Bucket"
    if (!error && (!data || data.length === 0) && courseCode) {
      console.log(`[RAG] 🌍 Course search returned nothing. Retrying Global...`);
      const { data: globalData, error: globalError } = await supabase.rpc("match_embeddings", {
        query_embedding: queryEmbedding,
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: TOP_K,
        filter_course_code: null,
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
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (err: any) {
      if (err instanceof SyntaxError || err.name === 'AbortError') {
        console.warn("[API] ⚠️ Failed to parse request body or client disconnected early.");
        return NextResponse.json({ error: "Invalid request or client disconnected" }, { status: 400 });
      }
      throw err;
    }

    const { messages, mode, enable_search, images, course_code, level } = body;

    // Check if we have any images in the request or history
    const hasImages = (images && images.length > 0) || 
                      body.image || 
                      messages.some(m => m.image || (m as any).images?.length);

    // Convert messages to Gemini format
    const geminiContents: { role: string; parts: Part[] }[] = messages.map((msg) => {
      const parts: Part[] = [];
      
      const msgImages = (msg as any).images || (msg.image ? [msg.image] : []);
      
      if (msgImages.length > 0) {
         // Note: Gemini expects base64 or file data for inline images in generateContent
         // If these are URLs, we might need to fetch them if the model doesn't support direct URL access
         // However, for brevity and consistency with previous logic, we'll assume they can be handled or added as text if URLs
         // Better: Gemini supports URL images via Google AI Studio, but in the SDK it's usually inlineData
         parts.push({ text: msg.content || "Analyze this image." });
         msgImages.forEach((url: string) => {
           // We'll treat URLs as text parts for now if they are absolute URLs
           // If they were base64, we'd use inlineData
           parts.push({ text: `[Image: ${url}]` });
         });
      } else {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts
      };
    });

    let systemPrompt = `You are STUDZY AI, the official academic assistant for DevCore'23, created by Samkiel. Your website is studzy.me

About the Creator:
Samkiel is a 200 level (Part 2) Software Engineering student at Obafemi Awolowo University and the founder of Studzy. He builds intelligent academic systems focused on helping university students study smarter using AI. portfolio link: 🔗 https://samkiel.dev

When asked about him, you can suggest searching for: "Samkiel Dev samuel ezekiel software engineer" or "Samuel Ezekiel software engineer portfolio".

Primary Mission:
Help 200-level Software Engineering students (SWE) in DevCore'23 understand their coursework deeply, revise efficiently, and pass exams confidently.

Academic Scope:
- Depth: 200-level (assume 100-level knowledge).
- No high school or PG-level complexity.
- Connect to software engineering concepts.
- Personality: Friendly, sharp, intelligent, light humor (Nigerian Gen Z vibe). Use light Pidgin like "DevCore'23 no dey carry last" naturally.
- Communication: Use headings, bullet points, no em dashes, no "in simple terms".

Honesty: If unsure, say "I don’t have enough verified information to answer that accurately." Do not fabricate facts.\n\n`;

    if (mode === "search" || enable_search) {
      systemPrompt += `SEARCH MODE ACTIVE. 
CRITICAL:
1. Provide the SEARCH RESULTS immediately in clean markdown. 
2. Use lists, bold text, and headers to present the data clearly.
3. If specific links or sources are found, include them.
4. Synthesize a brief final summary after the results.
5. NEVER output technical code/JSON or label segments like "web_search".\n\n`;
    }

    if (!genAI) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ 
      model: hasImages ? "gemini-1.5-flash" : "gemini-1.5-flash", 
      systemInstruction: systemPrompt.trim() || undefined,
      generationConfig: {
      }
    });

    const shouldStream = (body as any).stream !== false;
    console.log(`[API] AI Request (Gemini) - Mode: ${mode}, Streaming: ${shouldStream}, Has Images: ${hasImages}`);
    
    try {
      if (shouldStream) {
        const response = await model.generateContentStream({
          contents: geminiContents,
        });
        return streamResponse(response.stream);
      } else {
        const response = await model.generateContent({
           contents: geminiContents,
        });
        const content = response.response.text();
        return NextResponse.json({ content });
      }
    } catch (apiError: any) {
      console.error("[API] ❌ Gemini failure details:", apiError);
      return NextResponse.json(
        { error: `Gemini API Error: ${apiError.message}` },
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
 * Helper to convert Gemini stream to Next.js NextResponse
 */
async function streamResponse(stream: any) {
  const encoder = new TextEncoder();
  
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.text();
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

  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
