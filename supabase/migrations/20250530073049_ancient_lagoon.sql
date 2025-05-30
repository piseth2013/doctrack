/*
  # Create positions table and related schema

  1. New Tables
    - `positions`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on positions table
    - Add policies for:
      - Authenticated users can read all positions
      - Only admins can create/update/delete positions

  3. Triggers
    - Add trigger to automatically update updated_at timestamp
*/

-- Create positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view all positions"
  ON public.positions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create positions"
  ON public.positions
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
  ON public.positions
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
  ON public.positions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();