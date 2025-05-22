-- Drop the site_settings table if it exists
DROP TABLE IF EXISTS public.site_settings;

-- Remove the organization_assets bucket since it's no longer needed
DO $$
BEGIN
  DELETE FROM storage.buckets WHERE id = 'organization_assets';
END $$;