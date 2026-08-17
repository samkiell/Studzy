const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
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
`;

async function applyMigration() {
  console.log("Applying RLS fix to remote database...");
  // Since we don't have direct SQL execution via JS client easily without an RPC,
  // we might need to rely on the fact that the user can run this via dashboard or we use a clever hack.
  // Actually, standard supabase-js doesn't run raw SQL.
  // EXCEPT if there's an RPC for it, or we use the postgres connection string.

  // The user has a `reset_db` output earlier that showed `db remote info` failed.
  // The service role key allows bypassing RLS, but doesn't give direct SQL access unless we have a function.

  // Wait, I can't run raw SQL with supabase-js client.
  // But I can use the `pg` library if I had the connection string.
  // I only have the URL and Key.

  // Alternative: Use the `supabase` CLI to link and push.
  // I will try to link the project first.
  console.log(
    "This script is a placeholder. I will use the CLI to link and push.",
  );
}

applyMigration();
