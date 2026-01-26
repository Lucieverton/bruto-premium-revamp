import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS - restrict to production domain and preview URLs
const ALLOWED_ORIGINS = [
  'https://barbeariabrutos.lovable.app',
  'https://id-preview--db9a0e4b-44e5-4af7-b1f0-8924af68e6d6.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface CreateBarberRequest {
  email: string;
  password: string;
  display_name: string;
  specialty?: string;
  commission_percentage?: number;
}

// Rate limiting: max 10 barber creations per admin per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Check if caller is admin using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar funcionários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RATE LIMITING: Check recent barber creations by this admin
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { data: recentCreations, error: rateLimitError } = await adminClient
      .from('audit_logs')
      .select('id')
      .eq('actor_id', callerId)
      .eq('action', 'create_barber_user')
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('[create-barber-user] Rate limit check failed:', rateLimitError);
    }

    if (recentCreations && recentCreations.length >= RATE_LIMIT_MAX) {
      console.log(`[create-barber-user] Rate limit exceeded for admin ${callerId}`);
      return new Response(
        JSON.stringify({ error: 'Limite de criações excedido. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, display_name, specialty, commission_percentage }: CreateBarberRequest = await req.json();

    console.log(`[create-barber-user] Admin ${callerId} attempting to create barber with email: ${email}`);

    if (!email || !password || !display_name) {
      console.log(`[create-barber-user] Validation failed: missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Email, senha e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced password validation: minimum 8 characters, at least 1 number
    const hasNumber = /\d/.test(password);
    if (password.length < 8 || !hasNumber) {
      console.log(`[create-barber-user] Password validation failed for ${email}`);
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres e incluir pelo menos 1 número' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user
    const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name,
      }
    });

    if (createUserError || !newUser.user) {
      console.error(`[create-barber-user] Error creating user ${email}:`, createUserError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + (createUserError?.message || 'Erro desconhecido') }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-barber-user] User created successfully: ${newUser.user.id}`);

    // Create barber record linked to the user
    const { data: barberData, error: barberError } = await adminClient
      .from('barbers')
      .insert({
        user_id: newUser.user.id,
        display_name,
        specialty: specialty || null,
        commission_percentage: commission_percentage ?? 50,
      })
      .select()
      .single();

    if (barberError) {
      console.error(`[create-barber-user] Error creating barber record for ${email}:`, barberError);
      // Rollback: delete the created user
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar barbeiro: ' + barberError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-barber-user] Barber record created: ${barberData.id}`);

    // Assign barber role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'barber',
      });

    if (roleError) {
      console.error(`[create-barber-user] Error assigning role for ${email}:`, roleError);
      // Rollback
      await adminClient.from('barbers').delete().eq('id', barberData.id);
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao atribuir role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AUDIT LOGGING: Record this admin action
    const { error: auditError } = await adminClient
      .from('audit_logs')
      .insert({
        actor_id: callerId,
        action: 'create_barber_user',
        target_type: 'barber',
        target_id: barberData.id,
        details: {
          email: email,
          display_name: display_name,
          user_id: newUser.user.id,
        },
      });

    if (auditError) {
      console.error(`[create-barber-user] Failed to create audit log:`, auditError);
      // Don't fail the request for audit log errors, just log it
    }

    console.log(`[create-barber-user] SUCCESS - Barber created: ${display_name} (${email}) by admin ${callerId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        barber: barberData,
        message: 'Funcionário criado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
