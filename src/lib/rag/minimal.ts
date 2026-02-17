// ============================================
// Clean, Minimal RAG Implementation [DEBUG-READY]
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

/**
 * Execute the clean, minimal RAG flow with explicit logging.
 */
export async function runRAG(query: string, options: { topK?: number; threshold?: number } = {}) {
  const { topK = TOP_K, threshold = SIMILARITY_THRESHOLD } = options;

  console.log(`\n[RAG] >>> ENTERING RAG flow for query: "${query}"`);

  // 1. Generate Embedding
  try {
    const embedding = await embedText(query);
    console.log(`[RAG] ✅ EMBEDDING GENERATED (Length: ${embedding.length})`);

    // 2. Vector Search (Supabase RPC)
    console.log(`[RAG] FETCHING from collection: study_material_embeddings (threshold: ${threshold}, top-k: ${topK})`);
    
    const supabase = createAdminClient();
    const vectorStr = `[${embedding.join(',')}]`;
    
    const { data: chunks, error } = await supabase.rpc("match_embeddings", {
      query_embedding: vectorStr,
      match_threshold: threshold,
      match_count: topK
    });

    if (error) {
      console.error(`[RAG] ❌ VECTOR SEARCH FAILED: ${error.message}`);
      throw error;
    }

    const resultsCount = chunks?.length || 0;
    console.log(`[RAG] ✅ SEARCH RESULTS COUNT: ${resultsCount}`);
    
    if (resultsCount > 0) {
      console.log(`[RAG] RETRIEVED IDs: ${chunks.map((c: any) => c.id).join(", ")}`);
    } else {
      console.warn("[RAG] ⚠️ NO MATERIAL FOUND. Zero results returned from vector store.");
      return { answer: "I couldn't find any relevant study materials to answer this query.", sources: [] };
    }

    // 3. Inject Context into Prompt
    const context = chunks
      .map((c: any, i: number) => `[Source ${i+1}: ${c.file_path}]\n${c.content}`)
      .join("\n\n");

    const systemPrompt = `You are Studzy AI. Answer the user's question using ONLY the provided study materials.
If the answer is not in the materials, say you don't know.

STUDY MATERIALS:
${context}`;

    // 4. Call Mistral
    console.log(`[RAG] CALLING Mistral (${CHAT_MODEL})...`);
    const agentId = process.env.MISTRAL_AI_AGENT_ID;
    
    let response;
    if (agentId) {
      response = await client.agents.complete({
        agentId: agentId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
      });
    } else {
      response = await client.chat.complete({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.1,
      });
    }

    const answer = response.choices?.[0]?.message?.content || "No response generated.";
    console.log(`[RAG] ✅ RESPONSE GENERATED (${response.usage?.totalTokens || 0} tokens used)`);

    return {
      answer,
      sources: chunks.map((c: any) => ({
        id: c.id,
        filePath: c.file_path,
        content: c.content,
        similarity: c.similarity
      }))
    };

  } catch (error: any) {
    console.error(`[RAG] ❌ CRITICAL FAILURE in RAG flow:`, error);
    throw error;
  }
}

/**
 * High-level agent query wrapper
 */
export async function queryAgent(query: string) {
  try {
    return await runRAG(query);
  } catch (err) {
    console.error("[queryAgent] Failed:", err);
    return { 
      answer: "Something went wrong while retrieving information. Please try again later.", 
      sources: [] 
    };
  }
}
