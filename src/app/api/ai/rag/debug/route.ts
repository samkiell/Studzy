import { NextRequest, NextResponse } from "next/server";
import { checkRAGHealth, testRAGSearch } from "@/lib/rag/diagnostics";

/**
 * POST /api/ai/rag/debug
 * 
 * Trigger RAG diagnostics.
 * 
 * Body:
 * {
 *   "action": "health" | "test",
 *   "query": "test query" (required for action: "test")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { action, query } = await request.json();

    if (action === "health") {
      const health = await checkRAGHealth();
      return NextResponse.json({ success: true, ...health });
    }

    if (action === "test") {
      if (!query) {
        return NextResponse.json({ error: "query is required for test action" }, { status: 400 });
      }
      const results = await testRAGSearch(query);
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: "Invalid action. Use 'health' or 'test'." }, { status: 400 });
  } catch (error: any) {
    console.error("[RAG Debug API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
