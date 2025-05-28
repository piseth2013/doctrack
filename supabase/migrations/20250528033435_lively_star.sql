/*
  # Change profiles table to users table

  1. Changes
    - Rename profiles table to users
    - Update all foreign key references
    - Update RLS policies
    - Update triggers

  2. Security
    - Maintain existing RLS policies
    - Update policy names for clarity
*/

-- Rename the table
ALTER TABLE profiles RENAME TO users;

-- Update foreign key references
ALTER TABLE documents
DROP CONSTRAINT documents_user_id_fkey,
ADD CONSTRAINT documents_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Update RLS policies
ALTER POLICY "Enable read access for all users" ON users RENAME TO "Users can read all users";

-- Update triggers
ALTER TRIGGER staff_profiles_sync_trigger ON staff RENAME TO staff_users_sync_trigger;

-- Update trigger function
CREATE OR REPLACE FUNCTION sync_staff_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role, department)
  VALUES (
    gen_random_uuid(),
    NEW.email,
    NEW.name,
    'user',
    NULL
  );
  RETURN NEW;
END;
$$;