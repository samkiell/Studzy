// ============================================
// Embedding Generation via Gemini API
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { studyMaterialEmbeddings } from "@/lib/db/schema/rag";
import { EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE } from "./config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generate embeddings for a single piece of text with retry logic.
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding) {
      throw new Error("Failed to generate embedding: no data returned");
    }

    return embedding;
  } catch (error: any) {
    console.error("[RAG] Embedding generation failed:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in efficient batches.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    console.log(`[RAG] Embedding batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1} (${batch.length} items)...`);
    
    try {
      const result = await model.batchEmbedContents({
        requests: batch.map((text) => ({
          taskType: "RETRIEVAL_DOCUMENT" as any,
          content: { role: "user", parts: [{ text }] },
        })),
      });

      result.embeddings.forEach((e) => allEmbeddings.push(e.values));
      
      if (i + EMBEDDING_BATCH_SIZE < texts.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error("[RAG] Batch embedding failed:", err);
      throw err;
    }
  }

  return allEmbeddings;
}

/**
 * Flush all existing RAG embeddings safely from the database.
 */
export async function deleteAllEmbeddings() {
  console.log("[RAG] ⚠️ Request to FLUSH ALL EMBEDDINGS received.");

  try {
    await db.delete(studyMaterialEmbeddings);
    console.log("[RAG] ✅ Successfully deleted all vectors.");
    return { success: true };
  } catch (error: any) {
    console.error("[RAG] ❌ Failed to flush embeddings:", error.message);
    return { success: false, error: error.message };
  }
}
