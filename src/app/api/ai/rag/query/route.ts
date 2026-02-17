import { NextRequest, NextResponse } from "next/server";
import { queryRAG, queryRAGStream } from "@/lib/rag/query";

/**
 * POST /api/ai/rag/query
 *
 * Query the RAG system with a question.
 *
 * Body:
 * {
 *   "question": "What are the key concepts in CSC301?",
 *   "course_code": "CSC301",   // optional — filter by course
 *   "level": "300",             // optional — filter by level
 *   "stream": true,             // optional — default true (SSE streaming)
 *   "top_k": 5,                 // optional — number of chunks to retrieve
 *   "threshold": 0.5            // optional — minimum similarity
 * }
 *
 * Streaming response (SSE):
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 *   data: {"type":"sources","sources":[...]}
 *   data: [DONE]
 *
 * Non-streaming response:
 * {
 *   "answer": "...",
 *   "sources": [{ "filePath": "...", "similarity": 0.87, ... }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      course_code,
      level,
      stream = true,
      top_k,
      threshold,
    } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "question is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const queryOptions = {
      question: question.trim(),
      courseCode: course_code,
      level,
      topK: top_k,
      threshold,
    };

    // Non-streaming response
    if (!stream) {
      const { runRAG } = await import("@/lib/rag/minimal");
      const result = await runRAG(queryOptions.question, {
        topK: queryOptions.topK,
        threshold: queryOptions.threshold
      });
      return NextResponse.json(result);
    }

    // Streaming response (SSE)
    const { stream: readableStream } = await queryRAGStream(
      queryOptions,
      request.signal
    );

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[RAG Query API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
