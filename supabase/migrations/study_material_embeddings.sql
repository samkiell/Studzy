-- ============================================
-- STUDY MATERIAL EMBEDDINGS TABLE (pgvector)
-- ============================================

-- Enable pgvector extension (must already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the embeddings table
CREATE TABLE IF NOT EXISTS study_material_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    course_code TEXT,
    level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on file_path for deduplication checks
CREATE INDEX IF NOT EXISTS idx_embeddings_file_path
    ON study_material_embeddings(file_path);

-- Index on course_code for filtered queries
CREATE INDEX IF NOT EXISTS idx_embeddings_course_code
    ON study_material_embeddings(course_code);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
    ON study_material_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Enable RLS
ALTER TABLE study_material_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read embeddings
CREATE POLICY "Allow authenticated users to read embeddings"
    ON study_material_embeddings
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role full access (used by ingestion pipeline)
CREATE POLICY "Allow service role full access to embeddings"
    ON study_material_embeddings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- MATCH EMBEDDINGS RPC (cosine similarity)
-- ============================================
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(1024),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_course_code TEXT DEFAULT NULL,
    filter_level TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    file_path TEXT,
    content TEXT,
    course_code TEXT,
    level TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sme.id,
        sme.file_path,
        sme.content,
        sme.course_code,
        sme.level,
        1 - (sme.embedding <=> query_embedding) AS similarity
    FROM study_material_embeddings sme
    WHERE
        (1 - (sme.embedding <=> query_embedding)) > match_threshold
        AND (filter_course_code IS NULL OR sme.course_code = filter_course_code)
        AND (filter_level IS NULL OR sme.level = filter_level)
    ORDER BY sme.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
