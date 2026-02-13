-- Add slug column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing resources with a slug based on their title
UPDATE resources SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Ensure slugs don't start or end with a hyphen
UPDATE resources SET slug = regexp_replace(slug, '^-+|-+$', '', 'g')
WHERE slug ~ '^-+|-+$';

-- Handle empty slugs (if title was only special chars)
UPDATE resources SET slug = 'resource-' || substr(id::text, 1, 8)
WHERE slug = '' OR slug IS NULL;

-- Handle potential duplicates for existing data within same course
-- This is a one-time fix for existing data
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT id, course_id, slug,
               ROW_NUMBER() OVER (PARTITION BY course_id, slug ORDER BY created_at) as rn
        FROM resources
    ) LOOP
        IF r.rn > 1 THEN
            UPDATE resources 
            SET slug = r.slug || '-' || r.rn 
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- Make it NOT NULL and UNIQUE per course
ALTER TABLE resources ALTER COLUMN slug SET NOT NULL;
ALTER TABLE resources ADD CONSTRAINT resources_course_id_slug_key UNIQUE (course_id, slug);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
