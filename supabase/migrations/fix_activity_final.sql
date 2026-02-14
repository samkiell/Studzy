-- 1. Make resource_id nullable (as some activities like login/dashboard views don't have a resource)
ALTER TABLE public.user_activity ALTER COLUMN resource_id DROP NOT NULL;

-- 2. Ensure all required columns exist (re-running to be safe)
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Set a default value for action_type for any legacy null entries
UPDATE public.user_activity SET action_type = 'system_event' WHERE action_type IS NULL;
ALTER TABLE public.user_activity ALTER COLUMN action_type SET NOT NULL;

-- 4. CRITICAL: Force Supabase to refresh its inner schema cache
-- Run this to fix the "Could not find column ... in schema cache" error
NOTIFY pgrst, 'reload schema';

-- 5. Re-apply clean RLS policies
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;
CREATE POLICY "Users can insert own activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own activity" ON public.user_activity;
CREATE POLICY "Users can read own activity" 
ON public.user_activity 
FOR SELECT 
USING (auth.uid() = user_id);
