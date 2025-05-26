/*
  # Logo storage policies

  1. Changes
    - Add RLS policies for the logos bucket
    - Enable public read access
    - Restrict write operations to admin users
    
  2. Security
    - Anyone can view logos
    - Only admin users can upload/modify/delete logos
*/

BEGIN;

-- Drop any existing policies for logos bucket to avoid conflicts
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can manage logos" ON storage.objects;

-- Create policy for public read access
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Create policy for admin management
CREATE POLICY "Admin users can manage logos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMIT;