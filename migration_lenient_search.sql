-- Drop the old function signature 
DROP FUNCTION IF EXISTS match_embeddings(vector(1024), float, int, text, text);

-- Update the match_embeddings function to be more lenient with course_code and level
-- It will match (specific filters OR null values in the table)
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(1024),
    match_threshold FLOAT DEFAULT 0.3,
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
    username TEXT,
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
        sme.username,
        1 - (sme.embedding <=> query_embedding) AS similarity
    FROM study_material_embeddings sme
    WHERE
        (1 - (sme.embedding <=> query_embedding)) > match_threshold
        -- ✅ Lenient Filtering: Match specific code OR any global/null code
        AND (filter_course_code IS NULL OR sme.course_code = filter_course_code OR sme.course_code IS NULL)
        AND (filter_level IS NULL OR sme.level = filter_level OR sme.level IS NULL)
    ORDER BY sme.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
