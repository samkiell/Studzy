-- Enable citext for case-insensitive text support
CREATE EXTENSION IF NOT EXISTS citext;

-- Update the username column to use citext
ALTER TABLE public.profiles 
ALTER COLUMN username TYPE citext;

-- Add a unique constraint to ensure no two users can have the same username regardless of case
-- Note: This will fail if there are existing case-insensitive duplicates (e.g., 'admin' and 'ADMIN').
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_username_unique UNIQUE (username);
