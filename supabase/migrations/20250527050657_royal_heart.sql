/*
  # Sync staff data to profiles
  
  1. Changes
    - Add function to generate temporary passwords
    - Add function to sync new staff to profiles
    - Create trigger for new staff entries
    - Copy existing staff data to profiles while handling duplicates
  
  2. Security
    - Ensures no duplicate users are created
    - Maintains data integrity between staff and profiles
*/

-- Function to generate a random password hash
create or replace function generate_temp_password()
returns text as $$
begin
  return encode(gen_random_bytes(32), 'base64');
end;
$$ language plpgsql;

-- Function to copy staff data to profiles
create or replace function sync_staff_to_profiles()
returns trigger as $$
declare
  v_user_id uuid;
  v_existing_user_id uuid;
begin
  -- Check if user already exists in auth.users
  select id into v_existing_user_id
  from auth.users
  where email = NEW.email;

  if v_existing_user_id is null then
    -- Create auth.users entry if user doesn't exist
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.email,
      generate_temp_password(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    returning id into v_user_id;
  else
    v_user_id := v_existing_user_id;
  end if;

  -- Create profiles entry if it doesn't exist
  insert into profiles (
    id,
    email,
    full_name,
    role,
    department,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    NEW.email,
    NEW.name,
    'user',
    null,
    NEW.created_at,
    NEW.updated_at
  )
  on conflict (email) do nothing;

  return NEW;
end;
$$ language plpgsql;

-- Create trigger for new staff entries
create trigger staff_profiles_sync_trigger
  after insert on staff
  for each row
  execute function sync_staff_to_profiles();

-- Copy existing staff data to profiles
do $$
declare
  r record;
  v_user_id uuid;
  v_existing_user_id uuid;
begin
  for r in (select * from staff where email not in (select email from profiles)) loop
    -- Check if user already exists in auth.users
    select id into v_existing_user_id
    from auth.users
    where email = r.email;

    if v_existing_user_id is null then
      -- Create auth.users entry if user doesn't exist
      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_current,
        email_change_token_new,
        recovery_token
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        r.email,
        generate_temp_password(),
        now(),
        coalesce(r.created_at, now()),
        coalesce(r.updated_at, now()),
        '',
        '',
        '',
        ''
      )
      returning id into v_user_id;
    else
      v_user_id := v_existing_user_id;
    end if;

    -- Create profiles entry if it doesn't exist
    insert into profiles (
      id,
      email,
      full_name,
      role,
      department,
      created_at,
      updated_at
    )
    values (
      v_user_id,
      r.email,
      r.name,
      'user',
      null,
      coalesce(r.created_at, now()),
      coalesce(r.updated_at, now())
    )
    on conflict (email) do nothing;
  end loop;
end;
$$;