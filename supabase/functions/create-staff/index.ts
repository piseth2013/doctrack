import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { SMTPClient } from "npm:emailjs-smtp-client@2.0.1";

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: corsHeaders, status: 401 }
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
        { headers: corsHeaders, status: 403 }
      );
    }

    let payload: CreateStaffPayload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const { name, email, position_id, office_id } = payload;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A staff member with this email already exists' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Generate temporary password and verification code
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create auth user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    });

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    try {
      // Create profile
      const { error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email,
          full_name: name,
          role: 'user'
        });

      if (profileCreateError) {
        // Cleanup: Delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        throw profileCreateError;
      }

      // Create staff record
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('staff')
        .insert({
          id: user.id,
          name,
          email,
          position_id,
          office_id,
        })
        .select('*, positions(*), offices(*)')
        .single();

      if (staffError) {
        // Cleanup: Delete auth user and profile if staff creation fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        throw staffError;
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
          'Subject: Your DocTrack Account Details',
          'Content-Type: text/plain; charset=utf-8',
          '',
          `Hello ${name},`,
          '',
          'Your DocTrack account has been created. Here are your temporary credentials:',
          '',
          `Email: ${email}`,
          `Temporary Password: ${tempPassword}`,
          '',
          'Please use the following verification code when you first log in:',
          '',
          code,
          '',
          'This code will expire in 24 hours.',
          '',
          'For security reasons, please change your password after your first login.',
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
        // Don't throw error here, as the user is created and can request a password reset
      }

      return new Response(
        JSON.stringify({ 
          message: 'Staff created successfully',
          data: { staff }
        }),
        { headers: corsHeaders, status: 200 }
      );

    } catch (error) {
      // If any step fails after user creation, clean up the auth user
      if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in create-staff function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});