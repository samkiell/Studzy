-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on course code for faster lookups
CREATE INDEX idx_courses_code ON courses(code);

-- ============================================
-- RESOURCES TABLE
-- ============================================
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('audio', 'video', 'pdf')),
    file_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on course_id for faster joins
CREATE INDEX idx_resources_course_id ON resources(course_id);

-- Create index on type for filtering
CREATE INDEX idx_resources_type ON resources(type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Courses: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read courses"
    ON courses
    FOR SELECT
    TO authenticated
    USING (true);

-- Courses: Allow admins to insert
CREATE POLICY "Allow admins to insert courses"
    ON courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Courses: Allow admins to update
CREATE POLICY "Allow admins to update courses"
    ON courses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Courses: Allow admins to delete
CREATE POLICY "Allow admins to delete courses"
    ON courses
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Resources: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read resources"
    ON resources
    FOR SELECT
    TO authenticated
    USING (true);

-- Resources: Allow admins to insert
CREATE POLICY "Allow admins to insert resources"
    ON resources
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Resources: Allow admins to update
CREATE POLICY "Allow admins to update resources"
    ON resources
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Resources: Allow admins to delete
CREATE POLICY "Allow admins to delete resources"
    ON resources
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Run these commands in Supabase SQL Editor to set up storage:

-- Create the storage bucket (run this in Supabase Dashboard > Storage > New Bucket)
-- Or uncomment and run:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('studzy-materials', 'studzy-materials', true);

-- Storage policy: Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'studzy-materials');

-- Storage policy: Allow admins to upload files
CREATE POLICY "Allow admins to upload files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'studzy-materials' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Storage policy: Allow admins to delete files
CREATE POLICY "Allow admins to delete files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'studzy-materials' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Storage policy: Allow admins to update files
CREATE POLICY "Allow admins to update files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'studzy-materials' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- MAKE A USER AN ADMIN (run manually)
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- ============================================
-- USER ACTIVITY TABLE (tracks resource access)
-- ============================================
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_last_accessed ON user_activity(last_accessed DESC);

-- Enable RLS on user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can read their own activity
CREATE POLICY "Users can read own activity"
    ON user_activity
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
    ON user_activity
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own activity
CREATE POLICY "Users can update own activity"
    ON user_activity
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
