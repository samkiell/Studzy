// ============================================
// Embedding Generation via Mistral API
// ============================================

import { Mistral } from "@mistralai/mistralai";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE, EMBEDDING_TOKEN_LIMIT, TOKENS_PER_WORD } from "./config";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * Generate embeddings for a single piece of text.
 * Returns a 1024-dimensional vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    inputs: [text],
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Failed to generate embedding: no data returned");
  }

  return embedding as number[];
}

/**
 * Estimate tokens for a string safely.
 */
function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(wordCount * TOKENS_PER_WORD);
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
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 1000;

  // Track processing index
  let currentIdx = 0;
  const totalChunks = texts.length;
  let batchNum = 1;

  while (currentIdx < totalChunks) {
    // 1. Determine base batch size (up to EMBEDDING_BATCH_SIZE)
    let endIdx = Math.min(currentIdx + EMBEDDING_BATCH_SIZE, totalChunks);
    let batch = texts.slice(currentIdx, endIdx);

    // 2. Token-aware check and adaptive splitting
    let estimatedTokens = batch.reduce((sum, text) => sum + estimateTokens(text), 0);
    
    // If batch exceeds token limit, shrink until it fits (or we hit 1 chunk)
    while (estimatedTokens > EMBEDDING_TOKEN_LIMIT && batch.length > 1) {
      console.warn(`[RAG] Batch ${batchNum} exceeds token limit (${estimatedTokens} > ${EMBEDDING_TOKEN_LIMIT}). Splitting...`);
      endIdx--;
      batch = texts.slice(currentIdx, endIdx);
      estimatedTokens = batch.reduce((sum, text) => sum + estimateTokens(text), 0);
    }

    const avgTokens = Math.round(estimatedTokens / batch.length);
    
    // 3. Log stats before sending
    console.log(`[RAG] Embedding batch ${batchNum}:`);
    console.log(`- Chunks: ${batch.length}`);
    console.log(`- Estimated total tokens: ${estimatedTokens}`);
    console.log(`- Average tokens per chunk: ${avgTokens}`);

    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
      try {
        const response = await client.embeddings.create({
          model: EMBEDDING_MODEL,
          inputs: batch,
        });

        if (!response.data || response.data.length !== batch.length) {
          throw new Error(
            `Embedding batch ${batchNum} returned ${response.data?.length ?? 0} results, expected ${batch.length}`
          );
        }

        for (const item of response.data) {
          allEmbeddings.push(item.embedding as number[]);
        }
        
        success = true;

        // Progress update
        currentIdx += batch.length;
        batchNum++;

        // Throttling for 60 RPM limit
        if (currentIdx < totalChunks) {
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }
      } catch (error: any) {
        // Handle Rate Limiting (429)
        if (error.statusCode === 429 || error.status === 429) {
          retryCount++;
          const delay = INITIAL_DELAY * Math.pow(2, retryCount-1) + (Math.random() * 1000);
          console.warn(`[RAG] Rate limited (429). Retrying batch ${batchNum} in ${Math.round(delay)}ms... (Attempt ${retryCount}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // If message says "Too many tokens", let's try an invasive split if we haven't already
          if (error.message?.includes("tokens") && batch.length > 2) {
             console.error("[RAG] API reported token overflow despite extraction. Performing emergency split.");
          }
          throw error;
        }
      }
    }

    if (!success) {
      throw new Error(`Failed to embed batch ${batchNum} after ${MAX_RETRIES} attempts.`);
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

