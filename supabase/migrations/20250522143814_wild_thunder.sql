/*
  # Storage policies for organization assets

  1. Security
    - Enable public read access for organization assets
    - Allow admin users to upload and manage files
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Give public access to organization assets" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admin users to upload organization assets" ON storage.objects;
  
  -- Create policies
  CREATE POLICY "Give public access to organization assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organization_assets');

  CREATE POLICY "Allow admin users to upload organization assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organization_assets'
      AND EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.id = auth.users.id
        WHERE auth.uid() = auth.users.id
        AND profiles.role = 'admin'
      )
    );

  CREATE POLICY "Allow admin users to update organization assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organization_assets'
      AND EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.id = auth.users.id
        WHERE auth.uid() = auth.users.id
        AND profiles.role = 'admin'
      )
    );

  CREATE POLICY "Allow admin users to delete organization assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organization_assets'
      AND EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.id = auth.users.id
        WHERE auth.uid() = auth.users.id
        AND profiles.role = 'admin'
      )
    );
END $$;