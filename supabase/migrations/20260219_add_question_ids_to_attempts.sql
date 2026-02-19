-- Add question_ids to attempts table to enable persistent quiz ordering
-- Use UUID array to store the ordered sequence of questions for resumption
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_ids UUID[] DEFAULT '{}';

-- Optional: Comments for documentation
COMMENT ON COLUMN attempts.question_ids IS 'Ordered array of question IDs assigned to this attempt for persistent resumption.';
