-- Migration to add study time tracking
-- Run this in the Supabase SQL Editor

-- 1. Add total_study_seconds column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_study_seconds INTEGER DEFAULT 0;

-- 2. Create a function to safely increment study time
CREATE OR REPLACE FUNCTION increment_study_time(increment_seconds INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_study_seconds = COALESCE(total_study_seconds, 0) + increment_seconds
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. (Optional) Initialize existing users with an estimation based on unique views (30m per resource)
-- UPDATE profiles p
-- SET total_study_seconds = (
--     SELECT COUNT(DISTINCT resource_id) * 1800
--     FROM user_activity
--     WHERE user_id = p.id AND (action_type = 'view_resource' OR action_type IS NULL)
-- )
-- WHERE total_study_seconds = 0;
