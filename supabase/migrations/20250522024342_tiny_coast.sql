/*
  # Add demo admin user

  1. Changes
    - Insert demo admin user into auth.users table
    - Insert corresponding profile into public.profiles table
  
  2. Security
    - Uses secure password hashing
    - Sets up admin role for the demo user
*/

-- First, insert the demo user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Then, insert the corresponding profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  department,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'Demo Admin',
  'admin',
  'Administration',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;