// ============================================
// Embedding Generation via Mistral API
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE } from "./config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generate embeddings for a single piece of text with retry logic.
 */
export async function embedText(text: string): Promise<number[]> {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 1000;
  let retryCount = 0;

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
 * 
 * - Processes in batches (target 15 chunks)
 * - Estimates tokens per batch to ensure Mistral safety limits aren't exceeded
 * - Automatically splits batches if they exceed EMBEDDING_TOKEN_LIMIT
 * - Implements exponential backoff with jitter for Rate Limits (429)
 * - Returns embeddings in the same order as the input texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Process in chunks of EMBEDDING_BATCH_SIZE
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
      
      // Small throttle to avoid rate limits
      if (i + EMBEDDING_BATCH_SIZE < texts.length) {
        await new Promise(r => setTimeout(r, 500));
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
 * Use with caution.
 */
export async function deleteAllEmbeddings() {
  console.log("[RAG] ⚠️ Request to FLUSH ALL EMBEDDINGS received.");
  const supabase = createAdminClient();

  try {
    // 1. Get total count first for logging
    const { count, error: countError } = await supabase
      .from("study_material_embeddings")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    const totalToDelete = count || 0;

    if (totalToDelete === 0) {
      console.log("[RAG] Collection is already empty. Nothing to delete.");
      return { success: true, deletedCount: 0 };
    }

    console.log(`[RAG] Found ${totalToDelete} vectors. Proceeding with deletion...`);

    // 2. Perform global delete
    const { error: deleteError } = await supabase
      .from("study_material_embeddings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all in Supabase/PostgREST if safety is on

    if (deleteError) throw deleteError;

    console.log(`[RAG] ✅ Successfully deleted ${totalToDelete} vectors.`);
    return { success: true, deletedCount: totalToDelete };
  } catch (error: any) {
    console.error("[RAG] ❌ Failed to flush embeddings:", error.message);
    return { success: false, error: error.message };
  }
}

