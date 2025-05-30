-- Add position field to profiles table
ALTER TABLE profiles 
ADD COLUMN position text;

-- Drop positions table since data is now in profiles
DROP TABLE IF EXISTS positions;