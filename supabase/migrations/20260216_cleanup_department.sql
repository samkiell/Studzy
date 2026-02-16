-- Cleanup department tracking as the application is now strictly for Software Engineering students
ALTER TABLE profiles DROP COLUMN IF EXISTS department;

COMMENT ON COLUMN profiles.is_verified IS 'Whether the student is manually verified for ID card generation (reserved for SWE students)';
