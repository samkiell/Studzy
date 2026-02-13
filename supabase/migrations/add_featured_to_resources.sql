-- ============================================
-- MIGRATION: Add featured field to resources
-- Description: Adds a 'featured' boolean column to the resources table
--              to support "Recommended for Exam" functionality.
-- ============================================

-- Add the featured column with a default of false
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Create an index for faster queries on featured resources
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured)
WHERE featured = true;

-- Composite index for fetching featured resources per course efficiently
CREATE INDEX IF NOT EXISTS idx_resources_course_featured
ON resources(course_id, featured)
WHERE featured = true;
