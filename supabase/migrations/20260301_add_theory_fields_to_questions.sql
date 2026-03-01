-- ============================================
-- ADD THEORY FIELDS TO QUESTIONS TABLE
-- ============================================
-- Extends the existing questions table to support both MCQ and theory question types.
-- Existing MCQ questions are unaffected (all new columns are nullable with sensible defaults).

-- Question type discriminator
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'theory'));

-- Make correct_option nullable (theory questions don't have one)
ALTER TABLE questions ALTER COLUMN correct_option DROP NOT NULL;

-- Theory-specific fields
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS key_points JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS rubric TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS sub_questions JSONB;

-- Index on question_type for filtering
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);
