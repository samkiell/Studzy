-- Add completion_count to resources if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'resources' AND column_name = 'completion_count') THEN
    ALTER TABLE resources ADD COLUMN completion_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Ensure view_count has a default of 0
ALTER TABLE resources ALTER COLUMN view_count SET DEFAULT 0;
UPDATE resources SET view_count = 0 WHERE view_count IS NULL;

-- Ensure featured has a default of false
ALTER TABLE resources ALTER COLUMN featured SET DEFAULT false;
UPDATE resources SET featured = false WHERE featured IS NULL;

-- Ensure status has a default of 'published'
ALTER TABLE resources ALTER COLUMN status SET DEFAULT 'published';
UPDATE resources SET status = 'published' WHERE status IS NULL;
