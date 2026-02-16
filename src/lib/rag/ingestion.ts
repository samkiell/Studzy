// ============================================
// Ingestion Pipeline Orchestrator
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { extractPDFFromStorage } from "./pdf-extractor";
import { cleanText, hasSubstantialContent } from "./text-cleaner";
import { chunkText, type TextChunk } from "./chunker";
import { embedBatch } from "./embeddings";

export interface IngestionOptions {
  filePath: string;
  courseCode?: string;
  level?: string;
  username?: string;
  /** If true, re-process even if file was already ingested */
  force?: boolean;
}

export interface IngestionResult {
  success: boolean;
  filePath: string;
  chunksProcessed: number;
  chunksStored: number;
  pageCount: number;
  skipped: boolean;
  skipReason?: string;
  durationMs: number;
  error?: string;
}

/**
 * Check if a file has already been ingested (deduplication).
 */
async function isAlreadyIngested(filePath: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("study_material_embeddings")
    .select("id", { count: "exact", head: true })
    .eq("file_path", filePath);

  if (error) {
    console.warn(`[RAG] Dedup check failed for ${filePath}:`, error.message);
    return false; // Proceed with ingestion if check fails
  }

  return (count ?? 0) > 0;
}

/**
 * Store chunks and their embeddings into Supabase.
 * Uses batch insert for efficiency.
 */
async function storeChunksWithEmbeddings(
  chunks: TextChunk[],
  embeddings: number[][],
  filePath: string,
  courseCode?: string,
  level?: string,
  username?: string
): Promise<number> {
  const supabase = createAdminClient();

  // Build rows for insertion
  const rows = chunks.map((chunk, i) => ({
    file_path: filePath,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    course_code: courseCode || null,
    level: level || null,
    username: username || null,
  }));

  // Insert in batches of 50 to avoid payload size limits
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("study_material_embeddings")
      .insert(batch);

    if (error) {
      throw new Error(
        `Failed to store chunks (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${error.message}`
      );
    }

    totalInserted += batch.length;
    console.log(
      `[RAG] Stored ${totalInserted}/${rows.length} chunks for ${filePath}`
    );
  }

  return totalInserted;
}

/**
 * Run the full ingestion pipeline for a single PDF file.
 *
 * Pipeline steps:
 * 1. Deduplication check (skip if already ingested)
 * 2. Fetch PDF from Supabase Storage
 * 3. Extract text using pdf-parse
 * 4. Clean the text
 * 5. Chunk into 300–500 token overlapping segments
 * 6. Generate embeddings via Mistral API (batched)
 * 7. Store chunks + embeddings into Supabase
 */
export async function ingestFile(
  options: IngestionOptions
): Promise<IngestionResult> {
  const startTime = Date.now();
  const { filePath, courseCode, level, username, force } = options;

  console.log(`[RAG] Starting ingestion for: ${filePath}`);

  try {
    // Step 1: Deduplication check
    if (!force) {
      const alreadyDone = await isAlreadyIngested(filePath);
      if (alreadyDone) {
        console.log(`[RAG] Skipping (already ingested): ${filePath}`);
        return {
          success: true,
          filePath,
          chunksProcessed: 0,
          chunksStored: 0,
          pageCount: 0,
          skipped: true,
          skipReason: "File already ingested. Use force=true to re-process.",
          durationMs: Date.now() - startTime,
        };
      }
    } else {
      // If forcing, delete existing embeddings for this file first
      const supabase = createAdminClient();
      const { error: deleteError } = await supabase
        .from("study_material_embeddings")
        .delete()
        .eq("file_path", filePath);

      if (deleteError) {
        console.warn(
          `[RAG] Failed to delete existing embeddings for re-ingestion:`,
          deleteError.message
        );
      }
    }

    // Step 2: Fetch and extract PDF
    console.log(`[RAG] Extracting text from PDF...`);
    const { text: rawText, pageCount, fileName } = await extractPDFFromStorage(filePath);

    console.log(
      `[RAG] Extracted ${rawText.length} chars from ${pageCount} pages (${fileName})`
    );

    // Step 3: Clean text
    const cleanedText = cleanText(rawText);

    if (!hasSubstantialContent(cleanedText)) {
      return {
        success: true,
        filePath,
        chunksProcessed: 0,
        chunksStored: 0,
        pageCount,
        skipped: true,
        skipReason:
          "PDF has insufficient text content (too few words after cleaning).",
        durationMs: Date.now() - startTime,
      };
    }

    // Step 4: Chunk text
    console.log(`[RAG] Chunking text...`);
    const chunks = chunkText(cleanedText);
    console.log(`[RAG] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return {
        success: true,
        filePath,
        chunksProcessed: 0,
        chunksStored: 0,
        pageCount,
        skipped: true,
        skipReason: "No chunks generated from the text.",
        durationMs: Date.now() - startTime,
      };
    }

    // Step 5: Generate embeddings (batched)
    console.log(`[RAG] Generating embeddings for ${chunks.length} chunks...`);
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedBatch(texts);

    // Step 6: Store in Supabase
    console.log(`[RAG] Storing chunks in database...`);
    const stored = await storeChunksWithEmbeddings(
      chunks,
      embeddings,
      filePath,
      courseCode,
      level,
      username
    );

    const durationMs = Date.now() - startTime;
    console.log(
      `[RAG] ✅ Ingestion complete: ${stored} chunks stored in ${durationMs}ms`
    );

    return {
      success: true,
      filePath,
      chunksProcessed: chunks.length,
      chunksStored: stored,
      pageCount,
      skipped: false,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[RAG] ❌ Ingestion failed for ${filePath}:`, error);

    return {
      success: false,
      filePath,
      chunksProcessed: 0,
      chunksStored: 0,
      pageCount: 0,
      skipped: false,
      durationMs,
      error: error.message || "Unknown ingestion error",
    };
  }
}

/**
 * Ingest multiple files sequentially.
 * Useful for batch processing or webhook-triggered bulk ingestion.
 */
export async function ingestMultipleFiles(
  files: IngestionOptions[]
): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];

  for (const file of files) {
    const result = await ingestFile(file);
    results.push(result);
  }

  return results;
}
