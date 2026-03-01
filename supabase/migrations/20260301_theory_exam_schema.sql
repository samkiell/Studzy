-- ============================================
-- THEORY EXAM ENGINE SCHEMA
-- ============================================

-- Add exam_type column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT NULL;

-- ============================================
-- THEORY EXAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS theory_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT,
    exam_mode TEXT NOT NULL DEFAULT 'study' CHECK (exam_mode IN ('study', 'exam')),
    max_selectable_questions INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theory_exams_course_id ON theory_exams(course_id);

-- ============================================
-- THEORY QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS theory_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES theory_exams(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    main_question TEXT NOT NULL,
    marks INT NOT NULL DEFAULT 10,
    model_answer TEXT NOT NULL,
    key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    rubric TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theory_questions_exam_id ON theory_questions(exam_id);

-- ============================================
-- THEORY SUB-QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS theory_sub_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES theory_questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theory_sub_questions_question_id ON theory_sub_questions(question_id);

-- ============================================
-- THEORY ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS theory_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES theory_exams(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    feedback JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_theory_attempts_user_id ON theory_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_theory_attempts_exam_id ON theory_attempts(exam_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Theory Exams: all authenticated users can read
ALTER TABLE theory_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read theory exams"
    ON theory_exams
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admins to manage theory exams"
    ON theory_exams
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Theory Questions: all authenticated users can read
ALTER TABLE theory_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read theory questions"
    ON theory_questions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admins to manage theory questions"
    ON theory_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Theory Sub-Questions: all authenticated users can read
ALTER TABLE theory_sub_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read theory sub questions"
    ON theory_sub_questions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admins to manage theory sub questions"
    ON theory_sub_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Theory Attempts: users can read/insert/update their own
ALTER TABLE theory_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own theory attempts"
    ON theory_attempts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theory attempts"
    ON theory_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theory attempts"
    ON theory_attempts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all theory attempts"
    ON theory_attempts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
