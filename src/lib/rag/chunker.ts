// ============================================
// Text Chunking for RAG
// ============================================

import {
  CHUNK_SIZE_TOKENS,
  CHUNK_OVERLAP_TOKENS,
  TOKENS_PER_WORD,
  MAX_CHUNK_CHARS,
} from "./config";

export interface TextChunk {
  content: string;
  index: number;
  tokenEstimate: number;
}

/**
 * Estimate the number of tokens in a piece of text.
 * Uses word-count × multiplier as a fast approximation.
 */
function estimateTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(wordCount * TOKENS_PER_WORD);
}

/**
 * Split text into sentences. Handles common abbreviations
 * and avoids splitting on "Mr.", "Dr.", "e.g.", etc.
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  return sentences.filter((s) => s.trim().length > 0);
}

/**
 * Chunk text into overlapping segments of approximately CHUNK_SIZE_TOKENS tokens.
 *
 * Strategy:
 * 1. Split text into sentences to avoid mid-sentence breaks
 * 2. Accumulate sentences until target chunk size reached
 * 3. Apply overlap by including trailing sentences from previous chunk
 * 4. Enforce a max character limit as a safety net
 */
export function chunkText(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sentences = splitIntoSentences(text);

  if (sentences.length === 0) {
    return [];
  }

  // If the entire text fits in one chunk, return it as-is
  const totalTokens = estimateTokens(text);
  if (totalTokens <= CHUNK_SIZE_TOKENS) {
    return [
      {
        content: text.trim(),
        index: 0,
        tokenEstimate: totalTokens,
      },
    ];
  }

  let currentChunkSentences: string[] = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const sentenceTokens = estimateTokens(sentence);

    // If adding this sentence exceeds the chunk size, finalize current chunk
    if (
      currentTokenCount + sentenceTokens > CHUNK_SIZE_TOKENS &&
      currentChunkSentences.length > 0
    ) {
      const chunkContent = currentChunkSentences.join(" ").trim();

      // Safety: truncate if somehow exceeds character limit
      const finalContent =
        chunkContent.length > MAX_CHUNK_CHARS
          ? chunkContent.substring(0, MAX_CHUNK_CHARS)
          : chunkContent;

      chunks.push({
        content: finalContent,
        index: chunkIndex,
        tokenEstimate: estimateTokens(finalContent),
      });
      chunkIndex++;

      // Calculate overlap: keep the last N sentences that fit within overlap token budget
      const overlapSentences: string[] = [];
      let overlapTokens = 0;
      for (let j = currentChunkSentences.length - 1; j >= 0; j--) {
        const sTokens = estimateTokens(currentChunkSentences[j]);
        if (overlapTokens + sTokens > CHUNK_OVERLAP_TOKENS) break;
        overlapSentences.unshift(currentChunkSentences[j]);
        overlapTokens += sTokens;
      }

      currentChunkSentences = [...overlapSentences];
      currentTokenCount = overlapTokens;
    }

    currentChunkSentences.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  // Don't forget the last chunk
  if (currentChunkSentences.length > 0) {
    const chunkContent = currentChunkSentences.join(" ").trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content:
          chunkContent.length > MAX_CHUNK_CHARS
            ? chunkContent.substring(0, MAX_CHUNK_CHARS)
            : chunkContent,
        index: chunkIndex,
        tokenEstimate: estimateTokens(chunkContent),
      });
    }
  }

  return chunks;
}
