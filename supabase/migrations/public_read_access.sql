-- Allow anonymous users to read courses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow public read access for courses'
  ) THEN
    CREATE POLICY "Allow public read access for courses" ON courses
      FOR SELECT USING (true);
  END IF;
END $$;

-- Allow anonymous users to read resources
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resources' AND policyname = 'Allow public read access for resources'
  ) THEN
    CREATE POLICY "Allow public read access for resources" ON resources
      FOR SELECT USING (true);
  END IF;
END $$;
