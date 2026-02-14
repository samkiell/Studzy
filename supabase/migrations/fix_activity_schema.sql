-- Fix user_activity table schema mismatch
-- Add missing columns required by the application
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_activity ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Update existing rows to have a default action_type if they were created via the old schema
UPDATE public.user_activity 
SET action_type = 'view_resource' 
WHERE action_type IS NULL;

-- Now apply the NOT NULL constraint to action_type
ALTER TABLE public.user_activity ALTER COLUMN action_type SET NOT NULL;

-- Ensure RLS is enabled and policies are correct for the new structure
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

DROP POLICY IF EXISTS "Admins can read all activity" ON public.user_activity;
CREATE POLICY "Admins can read all activity" 
ON public.user_activity 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
