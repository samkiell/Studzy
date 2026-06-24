-- Update handle_new_user trigger function to extract metadata and resolve duplicate usernames
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    in_username TEXT;
    in_avatar TEXT;
    temp_username TEXT;
    counter INT := 1;
BEGIN
    in_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    in_avatar := NEW.raw_user_meta_data->>'avatar_url';
    
    temp_username := in_username;
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = temp_username AND id != NEW.id) LOOP
        temp_username := in_username || counter::text;
        counter := counter + 1;
    END LOOP;

    INSERT INTO public.profiles (id, email, role, username, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        'user', 
        temp_username,
        in_avatar
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        username = COALESCE(profiles.username, EXCLUDED.username),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
