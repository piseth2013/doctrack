/*
  # Add verification codes and update staff table

  1. New Tables
    - `verification_codes`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `code` (text, not null)
      - `expires_at` (timestamptz, not null)
      - `created_at` (timestamptz)

  2. Changes
    - Add `email` column to staff table
    - Add unique constraint on staff email

  3. Security
    - Enable RLS on verification_codes table
    - Add policies for verification code management
*/

-- Add email column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Create verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policies for verification codes
CREATE POLICY "Anyone can create verification codes"
  ON verification_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own verification codes"
  ON verification_codes
  FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims')::json->>'email');

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS trigger AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up expired codes
CREATE TRIGGER cleanup_expired_verification_codes
  AFTER INSERT ON verification_codes
  EXECUTE FUNCTION cleanup_expired_codes();