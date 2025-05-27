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
  position_id?: string | null;
  office_id?: string | null;
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
      throw new Error('Missing environment variables');
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
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      throw new Error('Invalid token');
    }

    // Verify caller is admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Get request payload
    const payload: CreateStaffPayload = await req.json();
    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    // Check if staff member already exists
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStaff) {
      throw new Error('A staff member with this email already exists');
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
      throw new Error(`Error creating staff record: ${staffError.message}`);
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
      // Clean up staff record if verification code creation fails
      await supabaseAdmin
        .from('staff')
        .delete()
        .eq('id', staff.id);
      throw new Error('Error creating verification code');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Staff created successfully',
        staff,
        verificationCode 
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in create-staff function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { headers: corsHeaders }
    );
  }
});