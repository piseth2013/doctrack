/*
  # Fix positions table and policies

  1. Tables
    - Ensure positions table exists with proper structure
    - Add position column to profiles if missing

  2. Security
    - Enable RLS on positions table
    - Create policies for positions table (with safe handling of existing policies)
    - Add trigger for updated_at column
*/

-- Safely add position column to profiles if it doesn't exist
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

-- Create positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'positions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view positions" ON positions;
  DROP POLICY IF EXISTS "Only admins can insert positions" ON positions;
  DROP POLICY IF EXISTS "Only admins can update positions" ON positions;
  DROP POLICY IF EXISTS "Only admins can delete positions" ON positions;
  
  -- Create new policies
  CREATE POLICY "Anyone can view positions"
    ON positions
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Only admins can insert positions"
    ON positions
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );

  CREATE POLICY "Only admins can update positions"
    ON positions
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );

  CREATE POLICY "Only admins can delete positions"
    ON positions
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_positions_updated_at'
  ) THEN
    CREATE TRIGGER update_positions_updated_at
      BEFORE UPDATE ON positions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;