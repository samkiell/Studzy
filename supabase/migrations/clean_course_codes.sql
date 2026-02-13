-- Remove spaces from all course codes
UPDATE courses
SET code = REPLACE(code, ' ', '');

-- Ensure codes are uppercase for consistency in URLs
UPDATE courses
SET code = UPPER(code);
