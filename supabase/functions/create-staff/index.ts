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
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Missing environment variables' 
        }),
        { headers: corsHeaders, status: 500 }
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
        JSON.stringify({ 
          success: false,
          message: 'No authorization header' 
        }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid token' 
        }),
        { headers: corsHeaders, status: 401 }
      );
    }

    // Verify caller is admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        }),
        { headers: corsHeaders, status: 403 }
      );
    }

    // Get request payload
    const payload: CreateStaffPayload = await req.json();
    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Name and email are required' 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Check if staff member already exists
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStaff) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'A staff member with this email already exists' 
        }),
        { headers: corsHeaders, status: 400 }
      );
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
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Failed to create staff member',
          details: staffError.message
        }),
        { headers: corsHeaders, status: 500 }
      );
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

      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Failed to create verification code',
          details: verificationError.message
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // TODO: Send email with verification code
    // For now, we'll return the code in the response for testing
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
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});