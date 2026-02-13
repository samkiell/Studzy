-- Remove spaces from all course codes
UPDATE courses
SET code = REPLACE(code, ' ', '')
WHERE code LIKE '% %';

-- Ensure codes are uppercase for consistency in URLs
UPDATE courses
SET code = UPPER(code)
WHERE code != UPPER(code);
