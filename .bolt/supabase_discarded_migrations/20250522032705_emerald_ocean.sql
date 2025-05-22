/*
  # Create Demo Admin User

  1. Changes
    - Creates a demo admin user with email 'demo.admin@doctrack.com'
    - Sets up the corresponding profile with admin role
  
  2. Security
    - Password is hashed by Supabase Auth
    - Profile is created with appropriate role and permissions
*/

-- Create the demo admin user in auth.users
-- Note: The password will be hashed by Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'demo.admin@doctrack.com',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create the corresponding profile in public.profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  department,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  'Demo Admin',
  'admin',
  'Administration',
  now(),
  now()
FROM auth.users
WHERE email = 'demo.admin@doctrack.com'
ON CONFLICT (id) DO NOTHING;