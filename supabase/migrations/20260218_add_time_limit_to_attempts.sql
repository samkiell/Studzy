-- Add time_limit_seconds to attempts table
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 1800;

-- Update existing records if necessary (optional)
-- UPDATE attempts SET time_limit_seconds = 1800 WHERE time_limit_seconds IS NULL;
