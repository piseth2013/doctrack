/*
  # Add Storage and Site Settings Policies

  1. Changes
    - Enable storage policies for organization_assets bucket
    - Add policies for admin users to manage storage assets
    - Update site_settings policies to properly handle logo updates

  2. Security
    - Ensure only admin users can upload and manage storage assets
    - Maintain public read access for organization assets
    - Verify admin-only access for site settings updates
*/

-- First, create storage policies for organization_assets bucket
BEGIN;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to upload files" ON storage.objects;

-- Create policy for public read access to organization assets
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

-- Create policy for admin users to manage files
CREATE POLICY "Allow admin users to upload files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Ensure site_settings has the correct policies
DROP POLICY IF EXISTS "Admin Manage Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;

-- Re-create the policies with proper checks
CREATE POLICY "Admin Manage Settings"
ON public.site_settings
FOR ALL
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

CREATE POLICY "Public Read Settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);

COMMIT;