-- Add position field to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE profiles ADD COLUMN position text;
  END IF;
END $$;

-- Drop positions table since data is now in profiles
DROP TABLE IF EXISTS positions;