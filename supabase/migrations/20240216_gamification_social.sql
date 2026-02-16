-- Migration: Add gamification, community and personalization features
-- Date: 2026-02-16

-- 1. Extend profiles for personalization and streaks
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- 2. Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 3. Create discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE, -- For nested replies
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create study presence table for "Currently Studying"
CREATE TABLE IF NOT EXISTS public.study_presence (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  last_pulse TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- 5. Add RLS policies (Basic placeholders - can be refined per requirement)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_presence ENABLE ROW LEVEL SECURITY;

-- Bookmarks: Users can only see and manage their own
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Discussions: Everyone can read, users can only edit/delete their own
CREATE POLICY "Discussions are readable by everyone" ON public.discussions
  FOR SELECT USING (true);
CREATE POLICY "Users can create discussions" ON public.discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own discussions" ON public.discussions
  FOR UPDATE USING (auth.uid() = user_id);

-- Study Presence: Simplified for pulse system
CREATE POLICY "Users can manage their own presence" ON public.study_presence
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Presence is readable by everyone" ON public.study_presence
  FOR SELECT USING (true);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_resource ON public.discussions(resource_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON public.discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_study_presence_course ON public.study_presence(course_id);
CREATE INDEX IF NOT EXISTS idx_study_presence_pulse ON public.study_presence(last_pulse);
