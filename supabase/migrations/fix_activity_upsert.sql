-- Add a unique constraint that allows us to upsert activity
-- We want to track the LATEST time a user performed a specific action on a resource
ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_resource_id_action_type_key;
ALTER TABLE public.user_activity ADD CONSTRAINT user_activity_user_id_resource_id_action_type_key UNIQUE (user_id, resource_id, action_type);

-- Force refresh the schema cache again
NOTIFY pgrst, 'reload schema';
