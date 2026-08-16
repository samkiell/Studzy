// ============================================
// RAG Query Pipeline
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { studyMaterialEmbeddings } from "@/lib/db/schema/rag";
import { sql } from "drizzle-orm";
import { embedText } from "./embeddings";
import { CHAT_MODEL, TOP_K } from "./config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface QueryOptions {
  question: string;
  courseCode?: string;
  level?: string;
  topK?: number;
  threshold?: number;
}

export interface RetrievedChunk {
  id: string;
  filePath: string;
  content: string;
  courseCode: string | null;
  level: string | null;
  similarity: number;
}

export interface QueryResult {
  answer: string;
  sources: RetrievedChunk[];
  tokensUsed?: number;
}

/**
 * Search for relevant chunks using pgvector cosine similarity via Drizzle.
 */
async function searchEmbeddings(
  queryEmbedding: number[],
  courseCode?: string,
  level?: string,
  topK: number = TOP_K,
  threshold: number = 0
): Promise<RetrievedChunk[]> {
  try {
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    // Query vectors using pgvector cosine distance operator (<=>)
    const results = await db.execute(sql`
      SELECT 
        id, 
        file_path, 
        content, 
        course_code, 
        level, 
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM study_material_embeddings
      WHERE 
        (${courseCode || null}::text IS NULL OR course_code = ${courseCode || null})
        AND (${level || null}::text IS NULL OR level = ${level || null})
        AND (1 - (embedding <=> ${vectorStr}::vector)) >= ${threshold}
      ORDER BY similarity DESC
      LIMIT ${topK};
    `);

    const rows = (results.rows || []) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      filePath: row.file_path,
      content: row.content,
      courseCode: row.course_code,
      level: row.level,
      similarity: Number(row.similarity) || 0,
    }));
  } catch (error: any) {
    console.error(`[RAG Search] ❌ Embedding search error:`, error);
    return [];
  }
}

/**
 * Build the system prompt with retrieved context chunks.
 */
function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return `You are Studzy AI, an academic assistant. You were asked a question but no relevant study materials were found in the database.

IMPORTANT: You MUST tell the user that you could not find relevant information in the study materials. Do NOT make up or hallucinate an answer. Say something like:
"I couldn't find relevant information about this topic in your study materials. Please make sure the relevant course materials have been uploaded and processed."`;
  }

  const contextBlocks = chunks
    .map(
      (chunk, i) =>
        `--- Source ${i + 1} (${chunk.filePath}, similarity: ${(chunk.similarity * 100).toFixed(1)}%) ---\n${chunk.content}`
    )
    .join("\n\n");

  return `You are STUDZY AI, the academic assistant for DevCore'23. Use the provided study materials to answer precisely.

CONTEXT FROM STUDY MATERIALS:
${contextBlocks}

INSTRUCTIONS:
- Answer based ONLY on the provided context.
- Target depth: 200-level Software Engineering.
- Style: Academic, clean structure, no em dashes.
- If it's not in the context, say: "I don’t have enough verified information in your study materials to answer this question accurately."`;
}

/**
 * Execute the full RAG query pipeline (non-streaming).
 */
export async function queryRAG(options: QueryOptions): Promise<QueryResult> {
  const {
    question,
    courseCode,
    level,
    topK = TOP_K,
    threshold = 0,
  } = options;

  const queryEmbedding = await embedText(question);

  const chunks = await searchEmbeddings(
    queryEmbedding,
    courseCode,
    level,
    topK,
    threshold
  );

  const systemPrompt = buildSystemPrompt(chunks);

  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL,
  });

  const response = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: systemPrompt + "\n\nQuestion: " + question }] }
    ],
  });

  const answer = response.response.text();

  return {
    answer,
    sources: chunks,
  };
}

/**
 * Execute the RAG query pipeline with streaming response.
 */
export async function queryRAGStream(
  options: QueryOptions,
  signal?: AbortSignal
): Promise<{ stream: ReadableStream; sources: RetrievedChunk[] }> {
  const {
    question,
    courseCode,
    level,
    topK = TOP_K,
    threshold = 0,
  } = options;

  const queryEmbedding = await embedText(question);

  const chunks = await searchEmbeddings(
    queryEmbedding,
    courseCode,
    level,
    topK,
    threshold
  );

  const systemPrompt = buildSystemPrompt(chunks);

  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL,
  });

  const streamResponse = await model.generateContentStream({
    contents: [
      { role: "user", parts: [{ text: systemPrompt + "\n\nQuestion: " + question }] }
    ],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamResponse.stream) {
          const content = chunk.text();
          if (content) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: { content } }],
                })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "sources",
              sources: chunks.map((c) => ({
                filePath: c.filePath,
                similarity: c.similarity,
                courseCode: c.courseCode,
              })),
            })}\n\n`
          )
        );

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        controller.error(err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      console.log("[RAG Query Stream] Client cancelled the stream");
    },
  });

  return { stream: readableStream, sources: chunks };
}
