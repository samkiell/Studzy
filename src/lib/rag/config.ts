// ============================================
// RAG Configuration Constants
// ============================================

/** Mistral embedding model — outputs 1024-dim vectors */
export const EMBEDDING_MODEL = "mistral-embed";

/** Mistral chat model for RAG responses */
export const CHAT_MODEL = "mistral-large-latest";

/** Target chunk size in tokens (approx) */
export const CHUNK_SIZE_TOKENS = 650;

/** Overlap between chunks in tokens (approx) */
export const CHUNK_OVERLAP_TOKENS = 100;

/** Max chunks to embed in a single Mistral API call */
export const EMBEDDING_BATCH_SIZE = 15;

/** Max tokens per embedding API request (Mistral safety limit) */
export const EMBEDDING_TOKEN_LIMIT = 16000;

/** Default number of results from similarity search */
export const TOP_K = 5;

/** Minimum similarity threshold for relevant results */
export const SIMILARITY_THRESHOLD = 0.3;

/** Supabase Storage bucket name */
export const STORAGE_BUCKET = "RAG";

/** Approximate tokens per word (English text) */
export const TOKENS_PER_WORD = 1.33;

/** Max content length per chunk in characters (safety limit) */
export const MAX_CHUNK_CHARS = 3000;
