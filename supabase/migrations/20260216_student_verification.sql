-- Create a migration to add verification and department to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Update existing admins to be verified by default if needed, 
-- but per requirements, manual verification is preferred.
-- For now, let's just ensure the columns exist.

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_verified IS 'Whether the student has been manually verified by an admin';
COMMENT ON COLUMN public.profiles.department IS 'The academic department the student belongs to';
