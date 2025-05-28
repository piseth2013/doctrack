import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

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
      throw new Error('Invalid authentication token');
    }

    // Verify caller is admin
    const { data: callerUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (userError || !callerUser || callerUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Get request payload
    const payload: CreateStaffPayload = await req.json();
    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    // Check if staff member already exists
    const { data: existingStaff, error: existingStaffError } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStaffError && existingStaffError.code !== 'PGRST116') {
      throw new Error('Error checking existing staff');
    }

    if (existingStaff) {
      throw new Error('A staff member with this email already exists');
    }

    // Generate a random verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Code expires in 24 hours

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
      throw new Error(`Failed to create staff member: ${staffError.message}`);
    }

    // Create verification code
    const { error: verificationError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (verificationError) {
      // Cleanup: delete staff record if verification code creation fails
      await supabaseAdmin
        .from('staff')
        .delete()
        .eq('id', staff.id);

      throw new Error(`Failed to create verification code: ${verificationError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Staff created successfully',
        staff,
        verificationCode, // Remove this in production and send via email instead
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-staff function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = errorMessage.includes('Unauthorized') ? 403 
      : errorMessage.includes('Invalid authentication token') ? 401
      : errorMessage.includes('already exists') ? 409
      : errorMessage.includes('required') ? 400
      : 500;

    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
      }),
      { headers: corsHeaders, status }
    );
  }
});