/*
  # Recreate positions table with proper structure and RLS

  1. New Tables
    - `positions`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `positions` table
    - Add policies for authenticated users to read positions
    - Add policies for admins to manage positions
    - Add trigger for automatic updated_at timestamp

  3. Data Migration
    - Safely migrate any existing position data
    - Update profiles table to use position_id foreign key
*/

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_position_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_position_id_fkey;
  END IF;
END $$;

-- Backup existing positions data if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions' AND table_schema = 'public') THEN
    -- Create temporary backup table
    CREATE TEMP TABLE positions_backup AS SELECT * FROM public.positions;
  END IF;
END $$;

-- Drop existing positions table if it exists
DROP TABLE IF EXISTS public.positions CASCADE;

-- Create positions table with proper structure
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for better performance
CREATE INDEX idx_positions_name ON public.positions(name);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for positions table

-- Policy: Anyone can view positions
CREATE POLICY "Anyone can view positions"
  ON public.positions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert positions
CREATE POLICY "Only admins can insert positions"
  ON public.positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update positions
CREATE POLICY "Only admins can update positions"
  ON public.positions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete positions
CREATE POLICY "Only admins can delete positions"
  ON public.positions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Restore data from backup if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions_backup') THEN
    INSERT INTO public.positions (id, name, description, created_at, updated_at)
    SELECT id, name, description, created_at, updated_at
    FROM positions_backup
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Add some default positions if table is empty
INSERT INTO public.positions (name, description) VALUES
  ('Manager', 'Management position with supervisory responsibilities'),
  ('Developer', 'Software development and programming role'),
  ('Analyst', 'Data analysis and research position'),
  ('Administrator', 'Administrative and operational support role'),
  ('Coordinator', 'Project coordination and management role')
ON CONFLICT (name) DO NOTHING;

-- Now update profiles table to use position_id properly
DO $$
BEGIN
  -- Add position_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND column_name = 'position_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN position_id uuid;
  END IF;

  -- Migrate existing position text data to position_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND column_name = 'position'
    AND table_schema = 'public'
  ) THEN
    -- Update position_id based on existing position text
    UPDATE public.profiles 
    SET position_id = (
      SELECT p.id 
      FROM public.positions p 
      WHERE p.name = profiles.position
      LIMIT 1
    )
    WHERE profiles.position IS NOT NULL 
    AND profiles.position_id IS NULL;

    -- Drop the old position column
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS position;
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_position_id_fkey 
FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_position_id ON public.profiles(position_id);

-- Update profiles RLS policies to work with position_id
DO $$
BEGIN
  -- Drop existing policies that might conflict
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  
  -- Recreate the policy with proper position_id handling
  CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id 
      AND role = (
        SELECT profiles_check.role 
        FROM public.profiles profiles_check 
        WHERE profiles_check.id = auth.uid()
      )
    );
END $$;