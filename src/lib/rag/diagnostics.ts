import { db } from "@/lib/db";
import { studyMaterialEmbeddings } from "@/lib/db/schema/rag";
import { count } from "drizzle-orm";
import { embedText } from "./embeddings";
import { EMBEDDING_MODEL } from "./config";

export async function checkRAGHealth() {
  console.log("\n[RAG DEBUG] --- Starting RAG Health Check ---");

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(studyMaterialEmbeddings);

    console.log(`[RAG DEBUG] ✅ Total vectors indexed: ${total}`);

    return { 
      status: "ok", 
      count: total,
    };
  } catch (err: any) {
    console.error("[RAG DEBUG] ❌ Error during health check:", err);
    throw err;
  }
}

export async function testRAGSearch(query: string) {
  console.log(`\n[RAG DEBUG] --- Starting SEARCH TEST for query: "${query}" ---`);
  const embedding = await embedText(query);
  return {
    queryVectorPrefix: embedding.slice(0, 5),
    matchCount: 0,
    matches: [],
  };
}

export async function debugVectorCount() {
  const [{ total }] = await db
    .select({ total: count() })
    .from(studyMaterialEmbeddings);

  console.log(`[RAG DEBUG] Total vectors in collection: ${total}`);
  return total || 0;
}

export async function debugSearch(query: string) {
  console.log(`\n[RAG DEBUG] --- DEBUG SEARCH START ---`);
  console.log(`[RAG DEBUG] Query Embedding Model: ${EMBEDDING_MODEL}`);
  const embedding = await embedText(query);
  console.log(`[RAG DEBUG] Generated embedding (dimension: ${embedding.length})`);
  return [];
}
