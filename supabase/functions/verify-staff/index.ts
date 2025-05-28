import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyStaffPayload {
  email: string;
  code: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
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

    const payload: VerifyStaffPayload = await req.json();
    const { email, code, password } = payload;

    // Verify code
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (verificationError || !verificationData) {
      throw new Error('Invalid or expired verification code');
    }

    // Get staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('email', email)
      .single();

    if (staffError || !staff) {
      throw new Error('Staff record not found');
    }

    // Create auth user
    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !user) {
      throw new Error(createUserError?.message || 'Failed to create user');
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email,
        full_name: staff.name,
        role: 'user',
      });

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Delete verification code
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('email', email);

    return new Response(
      JSON.stringify({ 
        message: 'Staff verification successful',
        user: {
          id: user.id,
          email,
          name: staff.name,
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