-- =============================================
-- ADD THEORY PERSISTENCE TO ATTEMPT_ANSWERS
-- =============================================
-- This migration adds columns to store student's theory answers 
-- and the AI-generated feedback/scores per question.

ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS theory_answer TEXT;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS ai_feedback JSONB;

COMMENT ON COLUMN attempt_answers.theory_answer IS 'The written text answer for theory questions.';
COMMENT ON COLUMN attempt_answers.ai_feedback IS 'AI-generated grading feedback, including score, strengths, and weaknesses.';
