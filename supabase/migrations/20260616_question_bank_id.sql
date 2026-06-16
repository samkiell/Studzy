-- Link each CBT question to the question-bank file (resource) it was uploaded from.
-- ON DELETE CASCADE => deleting the question-bank file removes all its questions.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS bank_id uuid REFERENCES resources(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON questions(bank_id);

-- Refresh PostgREST's schema cache so the new column is usable immediately.
NOTIFY pgrst, 'reload schema';
