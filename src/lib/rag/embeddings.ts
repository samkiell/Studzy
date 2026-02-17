// ============================================
// Embedding Generation via Mistral API
// ============================================

import { Mistral } from "@mistralai/mistralai";
import { EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE } from "./config";

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
 * Generate embeddings for multiple texts in efficient batches.
 * 
 * - Processes in larger batches (50) to minimize API round-trips
 * - Implements exponential backoff with jitter to handle Rate Limits (429)
 * - Returns embeddings in the same order as the input texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 1000; // 1s start

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / EMBEDDING_BATCH_SIZE);

    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
      try {
        console.log(
          `[RAG] Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)`
        );

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

        // Small success delay to pace requests (1.1s for safe < 60 RPM)
        if (i + EMBEDDING_BATCH_SIZE < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }
      } catch (error: any) {
        if (error.statusCode === 429 || error.status === 429) {
          retryCount++;
          const delay = INITIAL_DELAY * Math.pow(2, retryCount-1) + (Math.random() * 1000);
          console.warn(`[RAG] Rate limited (429). Retrying batch ${batchNum} in ${Math.round(delay)}ms... (Attempt ${retryCount}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
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
