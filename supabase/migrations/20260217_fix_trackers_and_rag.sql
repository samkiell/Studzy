-- ============================================
-- Fix Trackers and RAG Schema
-- ============================================

-- 1. Update user_activity unique constraint to allow multiple action types for the same resource
-- and handle NULL resource_id for login/system events.
ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_resource_id_key;

-- We use a unique index to handle potential NULLs in resource_id correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_unique_event 
ON public.user_activity (user_id, action_type, COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 2. Ensure profiles has all needed tracking columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_study_seconds INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- 3. Force schema reload
NOTIFY pgrst, 'reload schema';
