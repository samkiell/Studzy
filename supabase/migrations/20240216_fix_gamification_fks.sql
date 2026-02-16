-- Fix Foreign Keys to reference public.profiles
-- This enables PostgREST to join 'discussions' with 'profiles' automatically.

-- 1. Discussions
ALTER TABLE public.discussions
DROP CONSTRAINT IF EXISTS discussions_user_id_fkey;

ALTER TABLE public.discussions
ADD CONSTRAINT discussions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. Bookmarks
ALTER TABLE public.bookmarks
DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;

ALTER TABLE public.bookmarks
ADD CONSTRAINT bookmarks_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Study Presence
ALTER TABLE public.study_presence
DROP CONSTRAINT IF EXISTS study_presence_user_id_fkey;

ALTER TABLE public.study_presence
ADD CONSTRAINT study_presence_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
