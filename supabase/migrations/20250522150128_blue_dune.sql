/*
  # Fix storage policies for organization assets

  This migration updates the storage policies to ensure proper access control for organization assets.

  1. Changes
    - Drops all existing storage policies for organization_assets bucket
    - Creates new policies with proper access controls
    - Ensures bucket is public
    - Adds proper admin role checks for modifications
*/

-- Drop existing storage policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Give public access to organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admin users to upload organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admin users to update organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admin users to delete organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "organization_assets_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "organization_assets_admin_insert" ON storage.objects;
  DROP POLICY IF EXISTS "organization_assets_admin_update" ON storage.objects;
  DROP POLICY IF EXISTS "organization_assets_admin_delete" ON storage.objects;
END $$;

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create new storage policies with simplified names and proper checks
CREATE POLICY "organization_assets_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'organization_assets');

CREATE POLICY "organization_assets_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization_assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "organization_assets_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization_assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "organization_assets_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'organization_assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );