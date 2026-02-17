// ============================================
// RAG Diagnostic & Test Utilities
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "./embeddings";
import { TOP_K, SIMILARITY_THRESHOLD } from "./config";

/**
 * Diagnostic: Check total vector count and confirm table health.
 */
export async function checkRAGHealth() {
  console.log("\n[RAG DEBUG] --- Starting RAG Health Check ---");
  console.log(`[RAG DEBUG] Collection name: study_material_embeddings`);
  
  const supabase = createAdminClient();

  try {
    // 1. Check total count
    const { count, error } = await supabase
      .from("study_material_embeddings")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`[RAG DEBUG] ❌ Failed to count embeddings: ${error.message}`);
      return { status: "error", message: error.message };
    }

    console.log(`[RAG DEBUG] ✅ Total vectors indexed: ${count}`);

    // 2. Sample check
    const { data: sample, error: sampleError } = await supabase
      .from("study_material_embeddings")
      .select("id, file_path, embedding")
      .limit(1);

    if (sampleError) {
      console.error(`[RAG DEBUG] ❌ Failed to fetch sample: ${sampleError.message}`);
    } else if (sample && sample.length > 0) {
      const hasVector = !!sample[0].embedding;
      console.log(`[RAG DEBUG] ✅ Sample found: ${sample[0].file_path} (ID: ${sample[0].id})`);
      console.log(`[RAG DEBUG] ✅ Embedding exists in record: ${hasVector}`);
    } else {
      console.warn("[RAG DEBUG] ⚠️ The collection is EMPTY. No documents have been indexed yet.");
    }

    return { status: "ok", count };
  } catch (err: any) {
    console.error("[RAG DEBUG] ❌ Unexpected error during health check:", err);
    throw err;
  }
}

/**
 * Diagnostic: Run a minimal similarity search test.
 */
export async function testRAGSearch(query: string) {
  console.log(`\n[RAG DEBUG] --- Starting SEARCH TEST for query: "${query}" ---`);

  try {
    // 1. Generate test embedding
    console.log("[RAG DEBUG] Step 1: Generating embedding...");
    const embedding = await embedText(query);
    console.log(`[RAG DEBUG] ✅ Test embedding generated. Length: ${embedding.length}`);

    // 2. Run vector query
    console.log(`[RAG DEBUG] Step 2: Running vector query (match_embeddings RPC)...`);
    const supabase = createAdminClient();
    const { data: matches, error } = await supabase.rpc("match_embeddings", {
      query_embedding: embedding,
      match_threshold: 0.1, // Uses a lower threshold to confirm connectivity even for weak matches
      match_count: 5
    });

    if (error) {
      console.error(`[RAG DEBUG] ❌ Vector query failed: ${error.message}`);
      throw error;
    }

    const matchCount = matches?.length || 0;
    console.log(`[RAG DEBUG] ✅ Vector query completed. Matches found: ${matchCount}`);

    // 3. Log similarity results
    if (matchCount > 0) {
      console.log("[RAG DEBUG] Retrieval results:");
      matches.forEach((m: any, i: number) => {
        console.log(`   ${i + 1}. [SIM: ${m.similarity.toFixed(4)}] ID: ${m.id} -> File: ${m.file_path}`);
      });
    } else {
      console.warn("[RAG DEBUG] ⚠️ NO MATCHES FOUND. Even with a low threshold (0.1). Check if your query is relevant or if embeddings are correctly indexed.");
    }

    return matches;
  } catch (err: any) {
    console.error("[RAG DEBUG] ❌ Search test FAILED:", err);
    throw err;
  }
}
