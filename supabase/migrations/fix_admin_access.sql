-- 1. First, wipe the broken/recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- 2. Create a SECURITY DEFINER function to check admin status.
-- This function bypasses RLS, so it won't cause the recursive "infinite loop" that locked you out.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-apply clean, non-recursive policies
-- A user can always see their own profile
CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Admins can see all profiles using the helper function
CREATE POLICY "Admins can read all profiles"
    ON profiles
    FOR SELECT
    USING (is_admin_user());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON profiles
    FOR UPDATE
    USING (is_admin_user());

-- 4. Ensure your specific email is set as admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'studzyai@gmail.com';
