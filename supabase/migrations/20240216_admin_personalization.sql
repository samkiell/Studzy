-- Add personalization columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add uploader tracking to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS resources_uploader_id_idx ON public.resources(uploader_id);

-- Update RLS to allow reading uploader info
-- (Assuming profiles are public or at least readable by authenticated users)
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
  FOR SELECT USING (true);
