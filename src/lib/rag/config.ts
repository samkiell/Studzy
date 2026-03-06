// ============================================
// RAG Configuration Constants
// ============================================

/** Gemini embedding model — outputs 768-dim vectors */
export const EMBEDDING_MODEL = "text-embedding-004";

/** Gemini chat model for RAG responses — using stable 1.5-flash as requested */
export const CHAT_MODEL = "gemini-1.5-flash";

/** Target chunk size in tokens (approx) */
export const CHUNK_SIZE_TOKENS = 650;

/** Overlap between chunks in tokens (approx) */
export const CHUNK_OVERLAP_TOKENS = 100;

/** Max chunks to embed in a single Mistral API call */
export const EMBEDDING_BATCH_SIZE = 15;

/** Max tokens per embedding API request (Mistral safety limit) */
export const EMBEDDING_TOKEN_LIMIT = 16000;

/** Default number of results from similarity search */
export const TOP_K = 12;

/** Minimum similarity threshold for relevant results */
export const SIMILARITY_THRESHOLD = 0.22;

/** Supabase Storage bucket name for RAG and general dumps */
export const STORAGE_BUCKET = "RAG";

/** Supabase Storage bucket name for Study Materials (Audio, video, PDF) */
export const MATERIALS_BUCKET = "studzy-materials";

/** Approximate tokens per word (English text) */
export const TOKENS_PER_WORD = 1.33;

/** Max content length per chunk in characters (safety limit) */
export const MAX_CHUNK_CHARS = 3000;
