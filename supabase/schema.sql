-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Resources: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read resources"
    ON resources
    FOR SELECT
    TO authenticated
    USING (true);

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
