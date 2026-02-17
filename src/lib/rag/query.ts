// ============================================
// RAG Query Pipeline
// ============================================

import { Mistral } from "@mistralai/mistralai";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "./embeddings";
import {
  CHAT_MODEL,
  TOP_K,
  SIMILARITY_THRESHOLD,
} from "./config";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

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
 * Search for relevant chunks using pgvector cosine similarity.
 */
async function searchEmbeddings(
  queryEmbedding: number[],
  courseCode?: string,
  level?: string,
  topK: number = TOP_K,
  threshold: number = SIMILARITY_THRESHOLD
): Promise<RetrievedChunk[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_threshold: threshold,
    match_count: topK,
    filter_course_code: courseCode || null,
    filter_level: level || null,
  });

  if (error) {
    throw new Error(`Embedding search failed: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    filePath: row.file_path,
    content: row.content,
    courseCode: row.course_code,
    level: row.level,
    similarity: row.similarity,
  }));
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

  return `You are Studzy AI, an academic assistant that answers questions based on the student's uploaded study materials.

CONTEXT FROM STUDY MATERIALS:
${contextBlocks}

INSTRUCTIONS:
- Answer the question based ONLY on the provided context above.
- If the context does not contain enough information to answer the question, clearly state: "I don't have enough information in your study materials to answer this question."
- Do NOT make up or hallucinate information that is not in the context.
- Be concise, clear, and helpful.
- Use academic language appropriate for a university student.
- If referencing specific parts of the materials, mention which source it came from.
- Format your response with markdown for readability (headings, bullet points, etc.).`;
}

/**
 * Execute the full RAG query pipeline (non-streaming).
 *
 * 1. Embed the user's question
 * 2. Search for relevant chunks via pgvector
 * 3. Build system prompt with context
 * 4. Generate response from Mistral
 * 5. Return answer + sources
 */
export async function queryRAG(options: QueryOptions): Promise<QueryResult> {
  const {
    question,
    courseCode,
    level,
    topK = TOP_K,
    threshold = SIMILARITY_THRESHOLD,
  } = options;

  console.log(`[RAG Query] Question: "${question.substring(0, 80)}..."`);

  // Step 1: Embed the question
  const queryEmbedding = await embedText(question);

  // Step 2: Search for relevant chunks
  const chunks = await searchEmbeddings(
    queryEmbedding,
    courseCode,
    level,
    topK,
    threshold
  );

  if (chunks.length === 0) {
    console.log("[RAG Query] ⚠️ No matching study materials found.");
  } else {
    console.log(`[RAG Query] ✅ Found ${chunks.length} relevant chunks:`);
    chunks.forEach((c, i) => {
      console.log(`   Source ${i + 1}: ${c.filePath} (similarity: ${(c.similarity * 100).toFixed(1)}%)`);
    });
  }

  // Step 3: Build system prompt
  const systemPrompt = buildSystemPrompt(chunks);

  // Step 4: Generate response
  const agentId = process.env.MISTRAL_AI_AGENT_ID;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  let response;
  if (agentId) {
    response = await client.agents.complete({
      agentId: agentId,
      messages: messages as any,
    });
  } else {
    response = await client.chat.complete({
      model: CHAT_MODEL,
      messages: messages as any,
      temperature: 0.3,
    });
  }

  const answer =
    response.choices?.[0]?.message?.content || "Unable to generate a response.";

  return {
    answer: typeof answer === "string" ? answer : JSON.stringify(answer),
    sources: chunks,
    tokensUsed: response.usage?.totalTokens,
  };
}

/**
 * Execute the RAG query pipeline with streaming response.
 *
 * Returns a ReadableStream that emits SSE-formatted data chunks.
 * The final event includes sources metadata.
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
    threshold = SIMILARITY_THRESHOLD,
  } = options;

  console.log(
    `[RAG Query Stream] Question: "${question.substring(0, 80)}..."`
  );

  // Step 1: Embed the question
  const queryEmbedding = await embedText(question);

  // Step 2: Search for relevant chunks
  const chunks = await searchEmbeddings(
    queryEmbedding,
    courseCode,
    level,
    topK,
    threshold
  );

  if (chunks.length === 0) {
    console.log("[RAG Query Stream] ⚠️ No matching study materials found.");
  } else {
    console.log(`[RAG Query Stream] ✅ Found ${chunks.length} relevant chunks:`);
    chunks.forEach((c, i) => {
      console.log(`   Source ${i + 1}: ${c.filePath} (similarity: ${(c.similarity * 100).toFixed(1)}%)`);
    });
  }

  // Step 3: Build system prompt
  const systemPrompt = buildSystemPrompt(chunks);

  // Step 4: Create streaming response
  const agentId = process.env.MISTRAL_AI_AGENT_ID;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  let mistralStream;
  if (agentId) {
    mistralStream = await client.agents.stream({
      agentId: agentId,
      messages: messages as any,
    });
  } else {
    mistralStream = await client.chat.stream({
      model: CHAT_MODEL,
      messages: messages as any,
      temperature: 0.3,
    });
  }

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of mistralStream) {
          // Check if the request was aborted
          if (signal?.aborted) {
            controller.close();
            return;
          }

          const data = (chunk as any).data || chunk;
          const content = data.choices?.[0]?.delta?.content || "";
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

        // Send sources as a final event before [DONE]
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
          // Silently close on abort
          controller.close();
          return;
        }
        controller.error(err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Stream was cancelled by the client
      console.log("[RAG Query Stream] Client cancelled the stream");
    },
  });

  return { stream: readableStream, sources: chunks };
}
