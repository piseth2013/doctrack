/*
  # Create demo admin user

  1. Changes
    - Create demo admin user in auth.users
    - Create corresponding profile in public.profiles
*/

-- First, insert the demo user into auth.users
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
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
    '00000000-0000-0000-0000-000000000000',
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
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO demo_user_id;

  -- Then, insert the corresponding profile
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      department,
      created_at,
      updated_at
    ) VALUES (
      demo_user_id,
      'demo.admin@doctrack.com',
      'Demo Admin',
      'admin',
      'Administration',
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;