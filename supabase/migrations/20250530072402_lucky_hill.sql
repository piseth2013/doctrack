-- Drop foreign key constraint first
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_position_id_fkey;

-- Add position field to profiles table
ALTER TABLE profiles 
ADD COLUMN position text;

-- Drop positions table since data is now in profiles
DROP TABLE IF EXISTS positions;