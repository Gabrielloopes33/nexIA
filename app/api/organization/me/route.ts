import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()

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

    // Busca organização do usuário via Prisma (bypassa RLS do Supabase)
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    })

    if (!membership?.organization) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const org = membership.organization
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
