
import { NextResponse } from "next/server";
import { ingestFile } from "@/lib/rag/ingestion";

export async function GET() {
  try {
    console.log("[Debug Ingest] Triggering manual ingestion for Devcore_group.json");
    
    // We assume the file is at the root of the RAG bucket
    const result = await ingestFile({
      filePath: "Devcore_group.json",
      courseCode: "CHAT_LOGS", // Optional tag
      level: "raw", // Optional
      username: "system", // Optional
      force: true
    });

    return NextResponse.json({ 
      success: true, 
      result 
    });
  } catch (error: any) {
    console.error("[Debug Ingest] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
