import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { SmtpClient } from "npm:smtp@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateStaffPayload {
  name: string;
  email: string;
  position_id?: string;
  office_id?: string;
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

    const payload: CreateStaffPayload = await req.json();
    const { name, email, position_id, office_id } = payload;

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

    if (staffError) throw staffError;

    // Store verification code
    const { error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) throw codeError;

    // Send verification email
    const smtp = new SmtpClient();
    await smtp.connect({
      hostname: Deno.env.get('SMTP_HOST') ?? '',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      username: Deno.env.get('SMTP_USERNAME'),
      password: Deno.env.get('SMTP_PASSWORD'),
    });

    await smtp.send({
      from: Deno.env.get('SMTP_FROM') ?? '',
      to: email,
      subject: "Your DocTrack Verification Code",
      content: `
        Hello ${name},

        Welcome to DocTrack! Use the following code to verify your email and set up your account:

        ${code}

        This code will expire in 24 hours.

        Best regards,
        DocTrack Team
      `,
    });

    await smtp.close();

    return new Response(
      JSON.stringify({ 
        message: 'Staff created successfully',
        staff,
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