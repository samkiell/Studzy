-- ============================================
-- Ensure user_activity and user_progress tables exist
-- (Safe to run multiple times with IF NOT EXISTS)
-- ============================================

-- USER ACTIVITY TABLE (tracks resource access for "Continue Studying")
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_accessed ON user_activity(last_accessed DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies (use DO block to avoid errors if they already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity' AND policyname = 'Users can read own activity') THEN
    CREATE POLICY "Users can read own activity" ON user_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity' AND policyname = 'Users can insert own activity') THEN
    CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activity' AND policyname = 'Users can update own activity') THEN
    CREATE POLICY "Users can update own activity" ON user_activity FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- USER PROGRESS TABLE (tracks resource completion)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_resource_id ON user_progress(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, completed);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can read own progress') THEN
    CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can insert own progress') THEN
    CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can update own progress') THEN
    CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
