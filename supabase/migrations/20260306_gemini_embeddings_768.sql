-- ============================================
-- GEMINI EMBEDDINGS MIGRATION (768 Dimensions)
-- ============================================

-- 1. Update the table to 768 dimensions
-- Warning: This will set all existing embeddings to NULL or require a table truncation
TRUNCATE study_material_embeddings;

ALTER TABLE study_material_embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- 2. Update the match_embeddings RPC to handle 768-dim input
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(768),
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
