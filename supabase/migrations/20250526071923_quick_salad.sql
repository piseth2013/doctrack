/*
  # Add logo settings table

  1. New Tables
    - `logo_settings`
      - `id` (uuid, primary key)
      - `logo_url` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `logo_settings` table
    - Add policy for authenticated users to read logo settings
    - Add policy for admin users to update logo settings
*/

CREATE TABLE IF NOT EXISTS logo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE logo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read logo settings"
  ON logo_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update logo settings"
  ON logo_settings
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

-- Insert initial record
INSERT INTO logo_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;