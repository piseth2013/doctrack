import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateStaffUserPayload {
  email: string;
  name: string;
  position_id?: string;
  office_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
    });

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) throw new Error('Invalid token');

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const payload: CreateStaffUserPayload = await req.json();
    const { email, name, position_id, office_id } = payload;

    // Generate a random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // Create auth user
    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !user) throw createUserError;

    // Create profile
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email,
        full_name: name,
        role: 'user',
      });

    if (profileCreateError) {
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileCreateError;
    }

    // Create staff record
    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        id: user.id,
        name,
        position_id,
        office_id,
      });

    if (staffError) {
      // Cleanup: delete auth user and profile if staff creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw staffError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Staff user created successfully',
        user: {
          id: user.id,
          email,
          name,
          password, // Send back the generated password
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});