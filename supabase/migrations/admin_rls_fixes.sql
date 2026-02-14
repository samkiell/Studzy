-- Allow admins to see all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ensure admins can also see all user activity and progress
DROP POLICY IF EXISTS "Admins can read all user activity" ON user_activity;
CREATE POLICY "Admins can read all user activity"
    ON user_activity
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can read all user progress" ON user_progress;
CREATE POLICY "Admins can read all user progress"
    ON user_progress
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
