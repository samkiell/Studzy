// ============================================
// Ingestion Pipeline Orchestrator
// ============================================

import { db } from "@/lib/db";
import { studyMaterialEmbeddings } from "@/lib/db/schema/rag";
import { eq, count } from "drizzle-orm";
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
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(studyMaterialEmbeddings)
      .where(eq(studyMaterialEmbeddings.file_path, filePath));

    return (total ?? 0) > 0;
  } catch (error: any) {
    console.warn(`[RAG] Dedup check failed for ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Store chunks and their embeddings into Neon via Drizzle.
 */
async function storeChunksWithEmbeddings(
  chunks: TextChunk[],
  embeddings: number[][],
  filePath: string,
  courseCode?: string,
  level?: string,
  username?: string
): Promise<number> {
  const rows = chunks.map((chunk, i) => ({
    file_path: filePath,
    content: chunk.content,
    embedding: embeddings[i],
    course_code: courseCode || null,
    level: level || null,
    username: username || null,
    created_at: new Date(),
  }));

  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(studyMaterialEmbeddings).values(batch as any);
    totalInserted += batch.length;
    console.log(
      `[RAG] Stored ${totalInserted}/${rows.length} chunks for ${filePath}`
    );
  }

  return totalInserted;
}

/**
 * Run the full ingestion pipeline for a single PDF file.
 */
export async function ingestFile(
  options: IngestionOptions
): Promise<IngestionResult> {
  const startTime = Date.now();
  const { filePath, courseCode, level, username, force } = options;

  console.log(`[RAG] Starting ingestion for: ${filePath}`);

  try {
    const extension = filePath.split(".").pop()?.toLowerCase();
    if (extension !== "pdf") {
      console.log(`[RAG] Skipping unsupported file type: ${extension || "unknown"}`);
      return {
        success: true,
        filePath,
        chunksProcessed: 0,
        chunksStored: 0,
        pageCount: 0,
        skipped: true,
        skipReason: `RAG ingestion is restricted to PDF files. Found: .${extension || "none"}`,
        durationMs: Date.now() - startTime,
      };
    }

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
    }

    console.log(`[RAG] Extracting text from PDF...`);
    const { text: rawText, pageCount, fileName } = await extractPDFFromStorage(filePath);
    
    console.log(
      `[RAG] Extracted ${rawText.length} chars from ${pageCount} pages (${fileName})`
    );

    const cleanedText = cleanText(rawText);

    if (!hasSubstantialContent(cleanedText)) {
      console.warn(`[RAG] PDF has insufficient text content: ${filePath}`);
      return {
        success: true,
        filePath,
        chunksProcessed: 0,
        chunksStored: 0,
        pageCount,
        skipped: true,
        skipReason: "PDF has insufficient text content (too few readable words).",
        durationMs: Date.now() - startTime,
      };
    }

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
        skipReason: "No chunks generated from the text content.",
        durationMs: Date.now() - startTime,
      };
    }

    console.log(`[RAG] Generating embeddings for ${chunks.length} chunks...`);
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedBatch(texts);

    if (force) {
      console.log(`[RAG] Clearing existing embeddings for ${filePath} (forced re-ingestion)`);
      try {
        await db
          .delete(studyMaterialEmbeddings)
          .where(eq(studyMaterialEmbeddings.file_path, filePath));
      } catch (err: any) {
        console.warn(`[RAG] Failed to clear old embeddings during force re-ingest:`, err.message);
      }
    }

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
