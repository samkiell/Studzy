-- ============================================
-- MIGRATION: Admin Enhancements
-- 1. Resource Analytics (view_count)
-- 2. Draft vs Published (status)
-- ============================================

-- 1. Add view_count for analytics
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 2. Add status for draft/published
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
CHECK (status IN ('draft', 'published'));

-- Index for filtering published resources (student queries)
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status)
WHERE status = 'published';

-- Composite index for course + status queries
CREATE INDEX IF NOT EXISTS idx_resources_course_status
ON resources(course_id, status);
