import { createClient } from 'npm:@supabase/supabase-js@2';

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Security is enforced by JWT + admin role check below, so echo the caller origin
  // (site runs on lovable.app and on a custom HostGator domain).
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Não autorizado. Faça login novamente.' }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      console.error('[create-barber-user] auth error', userError?.message);
      return json({ error: 'Sessão expirada. Saia e entre novamente no painel.' }, 401);
    }
    const callerId = userData.user.id;

    const { data: roleData } = await admin
      .from('user_roles').select('role').eq('user_id', callerId).eq('role', 'admin').maybeSingle();
    if (!roleData) return json({ error: 'Apenas administradores podem criar funcionários' }, 403);

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await admin
      .from('audit_logs').select('id', { count: 'exact', head: true })
      .eq('actor_id', callerId).eq('action', 'create_barber_user').gte('created_at', since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return json({ error: 'Limite de cadastros por hora atingido. Tente mais tarde.' }, 429);
    }

    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'Dados inválidos' }, 400); }
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    let display_name = String(body?.display_name ?? '').trim();
    const existingBarberId: string | null = body?.barber_id ? String(body.barber_id) : null;
    if (existingBarberId) {
      if (!/^[0-9a-f-]{36}$/i.test(existingBarberId)) return json({ error: 'Barbeiro inválido' }, 400);
      const { data: eb } = await admin.from('barbers').select('id, display_name, user_id').eq('id', existingBarberId).maybeSingle();
      if (!eb) return json({ error: 'Barbeiro não encontrado' }, 404);
      if (eb.user_id) return json({ error: 'Este barbeiro já possui login' }, 400);
      display_name = eb.display_name;
    }
    const specialty = body?.specialty ? String(body.specialty).trim().slice(0, 100) : null;
    const commissionRaw = Number(body?.commission_percentage);
    const commission_percentage = Number.isFinite(commissionRaw) ? Math.min(100, Math.max(0, commissionRaw)) : 50;

    if (!email || !password || !display_name) return json({ error: 'Email, senha e nome são obrigatórios' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return json({ error: 'Email inválido' }, 400);
    if (display_name.length > 100) return json({ error: 'Nome muito longo' }, 400);
    if (password.length < 8 || !/\d/.test(password)) {
      return json({ error: 'A senha deve ter pelo menos 8 caracteres e incluir pelo menos 1 número' }, 400);
    }

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name },
    });
    if (createErr || !newUser?.user) {
      console.error('[create-barber-user] createUser error', createErr);
      const msg = (createErr?.message || '').toLowerCase();
      if ((createErr as any)?.code === 'email_exists' || msg.includes('already') || msg.includes('registered')) {
        return json({ error: 'Este email já está cadastrado' }, 400);
      }
      if (msg.includes('password')) return json({ error: 'Senha fraca ou comum demais. Escolha outra senha.' }, 400);
      return json({ error: 'Erro ao criar login: ' + (createErr?.message || 'desconhecido') }, 500);
    }
    const userId = newUser.user.id;

    let barber: any;
    if (existingBarberId) {
      const { data: upd, error: updErr } = await admin
        .from('barbers').update({ user_id: userId, is_active: true })
        .eq('id', existingBarberId).is('user_id', null).select().maybeSingle();
      if (updErr || !upd) {
        console.error('[create-barber-user] barber link error', updErr);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: 'Erro ao vincular login ao barbeiro' }, 500);
      }
      barber = upd;
    } else {
      const { data: ins, error: barberErr } = await admin
        .from('barbers')
        .insert({ user_id: userId, display_name, specialty, commission_percentage })
        .select().single();
      if (barberErr) {
        console.error('[create-barber-user] barber insert error', barberErr);
        await admin.auth.admin.deleteUser(userId);
        return json({ error: 'Erro ao criar barbeiro: ' + barberErr.message }, 500);
      }
      barber = ins;
    }

    const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: 'barber' });
    if (roleErr) {
      console.error('[create-barber-user] role insert error', roleErr);
      if (existingBarberId) {
        await admin.from('barbers').update({ user_id: null }).eq('id', barber.id);
      } else {
        await admin.from('barbers').delete().eq('id', barber.id);
      }
      await admin.auth.admin.deleteUser(userId);
      return json({ error: 'Erro ao liberar acesso: ' + roleErr.message }, 500);
    }

    await admin.from('audit_logs').insert({
      actor_id: callerId, action: existingBarberId ? 'enable_barber_login' : 'create_barber_user',
      target_type: 'barber', target_id: barber.id,
      details: { email, display_name, user_id: userId },
    });

    return json({ success: true, barber, message: 'Funcionário criado com sucesso' });
  } catch (error) {
    console.error('[create-barber-user] unexpected', error);
    return json({ error: 'Erro interno do servidor' }, 500);
  }
});
