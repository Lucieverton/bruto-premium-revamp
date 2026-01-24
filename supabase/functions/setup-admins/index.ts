import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const admins = [
      { email: 'luciel@barbearia.com', password: 'adm@96', name: 'Luciel' },
      { email: 'brutos@barbearia.com', password: 'adm@96', name: 'Brutos' },
    ]

    const results = []

    for (const admin of admins) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === admin.email)

      let userId: string

      if (existingUser) {
        userId = existingUser.id
        results.push({ email: admin.email, status: 'already exists', userId })
      } else {
        // Create user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: { name: admin.name },
        })

        if (createError) {
          results.push({ email: admin.email, status: 'error', error: createError.message })
          continue
        }

        userId = newUser.user.id
        results.push({ email: admin.email, status: 'created', userId })
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()

      if (!existingRole) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' })

        if (roleError) {
          results.push({ email: admin.email, roleStatus: 'error', error: roleError.message })
        } else {
          results.push({ email: admin.email, roleStatus: 'added' })
        }
      } else {
        results.push({ email: admin.email, roleStatus: 'already has admin role' })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
