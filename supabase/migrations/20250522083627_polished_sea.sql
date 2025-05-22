/*
  # Create organization assets storage bucket and policies
  
  This migration:
  1. Creates a storage bucket for organization assets
  2. Sets up RLS policies for admin access
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('organization_assets', 'organization_assets', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create security policies
DO $$ 
BEGIN
  -- Public read access
  EXECUTE format(
    'CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = %L)',
    'organization_assets'
  );

  -- Admin insert access
  EXECUTE format(
    'CREATE POLICY "Admin Insert Assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND (SELECT role = ''admin'' FROM public.profiles WHERE id = auth.uid()))',
    'organization_assets'
  );

  -- Admin update access
  EXECUTE format(
    'CREATE POLICY "Admin Update Assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND (SELECT role = ''admin'' FROM public.profiles WHERE id = auth.uid())) WITH CHECK (bucket_id = %L AND (SELECT role = ''admin'' FROM public.profiles WHERE id = auth.uid()))',
    'organization_assets',
    'organization_assets'
  );

  -- Admin delete access
  EXECUTE format(
    'CREATE POLICY "Admin Delete Assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND (SELECT role = ''admin'' FROM public.profiles WHERE id = auth.uid()))',
    'organization_assets'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;