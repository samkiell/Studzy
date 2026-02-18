-- Fix RLS for questions table to ensure admins can see all rows
-- This is critical for the ID aggregation logic (max(question_id)) to work correctly.

-- 1. Enable RLS on questions if not already enabled (just to be safe)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts or confusion
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

-- 3. Re-create robust policies

-- Everyone can view questions (for CBT execution)
CREATE POLICY "Questions are viewable by everyone" 
ON public.questions FOR SELECT 
TO authenticated 
USING (true);

-- Admins can do everything
CREATE POLICY "Admins can insert questions" 
ON public.questions FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update questions" 
ON public.questions FOR UPDATE
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete questions" 
ON public.questions FOR DELETE
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
