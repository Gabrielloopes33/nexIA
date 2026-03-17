import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Identifica o usuário autenticado via Supabase auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Usa service role (bypassa RLS) para buscar organization_id do usuário
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Usa service role para buscar detalhes da organização (bypassa RLS)
    const { data: org, error: orgError } = await supabaseServer
      .from('organizations')
      .select('id, name, slug, status')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !org) {
      // Retorna pelo menos o id se não conseguir os detalhes
      return NextResponse.json({
        id: userData.organization_id,
        name: '',
        slug: '',
        status: 'ACTIVE',
      })
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
    })
  } catch (error) {
    console.error('[API] Erro ao buscar organização:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
