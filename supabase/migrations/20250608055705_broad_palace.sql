/*
  # Create relationship between profiles and positions tables

  1. Database Changes
    - Add position_id column to profiles table
    - Migrate existing position text data to position_id references
    - Remove old position text column
    - Add foreign key constraint between profiles.position_id and positions.id
    - Add index for performance

  2. Data Migration
    - Attempts to preserve existing position data by matching names
    - Handles cases where position records don't exist
    - Provides warnings for unmatched data

  3. Constraints
    - Foreign key with ON DELETE SET NULL for data integrity
    - Index on position_id for better query performance
*/

-- Step 1: Add the new position_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'position_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN position_id uuid;
  END IF;
END $$;

-- Step 2: Migrate existing position data if both tables exist and have data
DO $$
BEGIN
  -- Check if both tables exist and have the necessary columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'positions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'position'
  ) THEN
    
    -- Migrate data by matching position names
    UPDATE public.profiles 
    SET position_id = positions.id
    FROM public.positions 
    WHERE profiles.position = positions.name
    AND profiles.position_id IS NULL
    AND profiles.position IS NOT NULL;
    
    -- Log any unmatched positions
    DECLARE
      unmatched_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO unmatched_count
      FROM public.profiles 
      WHERE position IS NOT NULL 
      AND position_id IS NULL;
      
      IF unmatched_count > 0 THEN
        RAISE NOTICE 'Warning: % profiles have position values that do not match any position records', unmatched_count;
      END IF;
    END;
  END IF;
END $$;

-- Step 3: Remove the old position column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'position'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN position;
  END IF;
END $$;

-- Step 4: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_position_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'positions'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_position_id_fkey 
    FOREIGN KEY (position_id) 
    REFERENCES public.positions(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 5: Create index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_position_id'
  ) THEN
    CREATE INDEX idx_profiles_position_id ON public.profiles(position_id);
  END IF;
END $$;