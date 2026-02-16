// ============================================
// RAG Module — Barrel Export
// ============================================

export { EMBEDDING_MODEL, CHAT_MODEL, CHUNK_SIZE_TOKENS, TOP_K, SIMILARITY_THRESHOLD, STORAGE_BUCKET } from "./config";
export { extractPDFFromStorage, getPublicUrl, getSignedUrl } from "./pdf-extractor";
export { cleanText, hasSubstantialContent } from "./text-cleaner";
export { chunkText, type TextChunk } from "./chunker";
export { embedText, embedBatch } from "./embeddings";
export { ingestFile, ingestMultipleFiles, type IngestionOptions, type IngestionResult } from "./ingestion";
export { queryRAG, queryRAGStream, type QueryOptions, type QueryResult, type RetrievedChunk } from "./query";
