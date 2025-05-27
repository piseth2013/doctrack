import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { generate } from 'npm:generate-password@1.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

interface CreateStaffPayload {
  name: string;
  email: string;
  position_id?: string;
  office_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
    });

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is missing' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Verify caller is admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Get request payload
    let payload: CreateStaffPayload;
    try {
      payload = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request payload' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Check if staff member already exists
    const { data: existingStaff, error: existingStaffError } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStaffError && existingStaffError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Error checking existing staff' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    if (existingStaff) {
      return new Response(
        JSON.stringify({ error: 'A staff member with this email already exists' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Generate verification code
    const verificationCode = generate({
      length: 6,
      numbers: true,
      uppercase: false,
      lowercase: false,
      symbols: false
    });

    // Create verification code record
    const { error: verificationError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email,
        code: verificationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours expiry
      });

    if (verificationError) {
      return new Response(
        JSON.stringify({ error: 'Error creating verification code' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Create staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        name,
        email,
        position_id: position_id || null,
        office_id: office_id || null,
      })
      .select('*, positions(*), offices(*)')
      .single();

    if (staffError) {
      return new Response(
        JSON.stringify({ error: 'Error creating staff record' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Send verification email
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        verification_code: verificationCode,
        name: name
      }
    });

    if (emailError) {
      // If email fails, we should clean up the created records
      await supabaseAdmin
        .from('staff')
        .delete()
        .eq('id', staff.id);
      
      await supabaseAdmin
        .from('verification_codes')
        .delete()
        .eq('email', email);

      return new Response(
        JSON.stringify({ error: 'Error sending verification email' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Staff created successfully. Verification email sent.',
        staff 
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-staff function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { headers: corsHeaders, status: 200 }
    );
  }
});