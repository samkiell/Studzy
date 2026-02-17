
-- Fix user_activity for proper upsert and RLS
-- This migration ensures that upserts work even with NULL resource_id
-- and that users have permission to update their own activity records.

-- 1. Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update own activity" ON public.user_activity;
CREATE POLICY "Users can update own activity"
    ON public.user_activity
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Clean up old constraints/indexes
ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_resource_id_key;
ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_resource_id_action_type_key;
ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_upsert_unique;
DROP INDEX IF EXISTS idx_user_activity_unique_event;
DROP INDEX IF EXISTS idx_user_activity_upsert_fallback;

-- 3. Create a unique constraint that handles NULLs correctly (Postgres 15+)
-- This allows ON CONFLICT (user_id, action_type, resource_id) to work even when resource_id is NULL.
ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_upsert_unique 
UNIQUE NULLS NOT DISTINCT (user_id, action_type, resource_id);

-- 4. Force reload schema cache
NOTIFY pgrst, 'reload schema';
