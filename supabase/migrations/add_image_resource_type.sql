-- Add 'image' to the ResourceType check constraint
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_type_check CHECK (type IN ('audio', 'video', 'pdf', 'image'));
