/*
  # Create organization assets bucket and policies
  
  1. Changes
    - Create organization_assets bucket in storage schema
    - Add RLS policies for public access and admin management
    
  2. Security
    - Enable public read access
    - Restrict write operations to admin users only
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin Insert Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

CREATE POLICY "Admin Update Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

CREATE POLICY "Admin Delete Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);