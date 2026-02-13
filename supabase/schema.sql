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
-- SEED DATA: COURSES
-- ============================================
INSERT INTO courses (code, title, description) VALUES
(
    'SEN 201',
    'Elements of Software Construction I',
    'Introduction to fundamental concepts of software development including programming paradigms, software lifecycle, and basic design principles.'
),
(
    'SEN 205',
    'Software Requirements and Design',
    'Techniques for gathering, analyzing, and documenting software requirements. Introduction to software design methodologies and UML modeling.'
),
(
    'MTH 201',
    'Mathematical Methods I',
    'Advanced mathematical techniques including differential equations, linear algebra, and numerical methods for engineering applications.'
),
(
    'STT 201',
    'Fundamentals of Statistical Theory and Analysis',
    'Core concepts of probability theory, statistical inference, hypothesis testing, and data analysis techniques.'
),
(
    'SEN 203',
    'Discrete Structures',
    'Mathematical foundations for computer science including logic, sets, relations, functions, graphs, and combinatorics.'
),
(
    'CPE 203',
    'Introduction to Digital Systems I',
    'Fundamentals of digital logic design, Boolean algebra, combinational and sequential circuits, and basic computer architecture.'
),
(
    'CSC 201',
    'Introduction to Programming I',
    'Introduction to programming concepts using a high-level language. Topics include variables, control structures, functions, arrays, and basic algorithms.'
);

-- ============================================
-- SEED DATA: SAMPLE RESOURCES
-- ============================================
INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Course Introduction',
    'video',
    'https://example.com/videos/intro.mp4',
    'Welcome video introducing the course objectives and structure.'
FROM courses c WHERE c.code = 'SEN 201';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Software Development Lifecycle Overview',
    'pdf',
    'https://example.com/docs/sdlc.pdf',
    'Comprehensive guide to understanding the software development lifecycle.'
FROM courses c WHERE c.code = 'SEN 201';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Requirements Engineering Lecture',
    'audio',
    'https://example.com/audio/req-eng.mp3',
    'Audio lecture on requirements engineering fundamentals.'
FROM courses c WHERE c.code = 'SEN 205';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'UML Diagrams Cheat Sheet',
    'pdf',
    'https://example.com/docs/uml-cheatsheet.pdf',
    'Quick reference guide for all UML diagram types.'
FROM courses c WHERE c.code = 'SEN 205';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Differential Equations Tutorial',
    'video',
    'https://example.com/videos/diff-eq.mp4',
    'Step-by-step tutorial on solving differential equations.'
FROM courses c WHERE c.code = 'MTH 201';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Probability Distributions Explained',
    'video',
    'https://example.com/videos/prob-dist.mp4',
    'Visual explanation of common probability distributions.'
FROM courses c WHERE c.code = 'STT 201';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Graph Theory Notes',
    'pdf',
    'https://example.com/docs/graph-theory.pdf',
    'Comprehensive notes on graph theory and its applications.'
FROM courses c WHERE c.code = 'SEN 203';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Boolean Algebra Fundamentals',
    'pdf',
    'https://example.com/docs/boolean-algebra.pdf',
    'Introduction to Boolean algebra and logic gates.'
FROM courses c WHERE c.code = 'CPE 203';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Getting Started with Programming',
    'video',
    'https://example.com/videos/prog-intro.mp4',
    'Beginner-friendly introduction to programming concepts.'
FROM courses c WHERE c.code = 'CSC 201';

INSERT INTO resources (course_id, title, type, file_url, description)
SELECT 
    c.id,
    'Loops and Control Structures',
    'audio',
    'https://example.com/audio/loops.mp3',
    'Audio lecture explaining loops, conditionals, and control flow.'
FROM courses c WHERE c.code = 'CSC 201';

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Run these commands in Supabase SQL Editor to set up storage:

-- Create the storage bucket (if not using Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('studzy-materials', 'studzy-materials', true);

-- Storage policy: Allow authenticated users to read files
-- CREATE POLICY "Allow authenticated users to read files"
--     ON storage.objects
--     FOR SELECT
--     TO authenticated
--     USING (bucket_id = 'studzy-materials');

-- Storage policy: Allow admins to upload files
-- CREATE POLICY "Allow admins to upload files"
--     ON storage.objects
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (
--         bucket_id = 'studzy-materials' AND
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- Storage policy: Allow admins to delete files
-- CREATE POLICY "Allow admins to delete files"
--     ON storage.objects
--     FOR DELETE
--     TO authenticated
--     USING (
--         bucket_id = 'studzy-materials' AND
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- ============================================
-- MAKE A USER AN ADMIN (run manually)
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
