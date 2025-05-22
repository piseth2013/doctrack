/*
  # Fix organization assets storage policies

  1. Changes
    - Drop and recreate site_settings policies
    - Drop existing storage policies
    - Create storage policies for organization assets bucket
    
  2. Security
    - Maintain public read access for site settings
    - Ensure only admins can modify site settings
    - Set up proper storage access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can modify site settings" ON site_settings;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete organization assets" ON storage.objects;

-- Recreate policies with correct rules
CREATE POLICY "Public can view site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Enable storage for organization assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view organization assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'organization_assets');

CREATE POLICY "Authenticated users can upload organization assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization_assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can update organization assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization_assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can delete organization assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'organization_assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );