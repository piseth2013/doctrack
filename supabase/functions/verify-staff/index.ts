import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
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
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid or expired verification code' 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Get staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('email', email)
      .single();

    if (staffError || !staff) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Staff record not found' 
        }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // Create auth user
    const { data: { user }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: createUserError?.message || 'Failed to create user' 
        }),
        { headers: corsHeaders, status: 500 }
      );
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
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Failed to create profile: ${profileError.message}` 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Delete verification code
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('email', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Staff verification successful',
        user: {
          id: user.id,
          email,
          name: staff.name,
        },
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});