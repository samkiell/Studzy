-- 1. Add the missing column
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 1800;

-- 2. Force Supabase to refresh the cache
NOTIFY pgrst, 'reload schema';
