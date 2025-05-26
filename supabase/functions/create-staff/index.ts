import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { SMTPClient } from "npm:smtp-client@4.0.0";

// Update CORS headers to be more specific about allowed origins and headers
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    // Initialize Supabase client with error checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
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
        JSON.stringify({ error: 'No authorization header' }),
        { 
          headers: corsHeaders,
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          headers: corsHeaders,
          status: 401 
        }
      );
    }

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { 
          headers: corsHeaders,
          status: 403 
        }
      );
    }

    // Parse and validate request payload
    let payload: CreateStaffPayload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }

    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }

    // Generate verification code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Code expires in 24 hours

    // Create staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        name,
        email,
        position_id,
        office_id,
      })
      .select()
      .single();

    if (staffError) {
      return new Response(
        JSON.stringify({ error: staffError.message }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }

    // Store verification code
    const { error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) {
      console.error('Failed to create verification code:', codeError);
    }

    // Send verification email
    try {
      const smtpHost = Deno.env.get('SMTP_HOST');
      const smtpPort = Deno.env.get('SMTP_PORT');
      const smtpUsername = Deno.env.get('SMTP_USERNAME');
      const smtpPassword = Deno.env.get('SMTP_PASSWORD');
      const smtpFrom = Deno.env.get('SMTP_FROM');

      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFrom) {
        throw new Error('Missing SMTP configuration');
      }

      const client = new SMTPClient({
        host: smtpHost,
        port: parseInt(smtpPort),
        username: smtpUsername,
        password: smtpPassword,
        secure: true,
      });

      await client.connect();
      await client.greet({ hostname: smtpHost });
      await client.authPlain({ username: smtpUsername, password: smtpPassword });

      const message = [
        `From: ${smtpFrom}`,
        `To: ${email}`,
        'Subject: Your DocTrack Verification Code',
        'Content-Type: text/plain; charset=utf-8',
        '',
        `Hello ${name},`,
        '',
        'Welcome to DocTrack! Use the following code to verify your email and set up your account:',
        '',
        code,
        '',
        'This code will expire in 24 hours.',
        '',
        'Best regards,',
        'DocTrack Team'
      ].join('\r\n');

      await client.mail({ from: smtpFrom });
      await client.rcpt({ to: email });
      await client.data(message);
      await client.quit();

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Staff created successfully',
        staff,
      }),
      {
        headers: corsHeaders,
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in create-staff function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        headers: corsHeaders,
        status: 500,
      },
    );
  }
});