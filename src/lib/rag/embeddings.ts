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
 * - Processes in batches of EMBEDDING_BATCH_SIZE (10) to respect rate limits
 * - Adds a small delay between batches to avoid 429 errors
 * - Returns embeddings in the same order as the input texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / EMBEDDING_BATCH_SIZE);

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

    // Rate limiting: pause 200ms between batches (except the last one)
    if (i + EMBEDDING_BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allEmbeddings;
}
