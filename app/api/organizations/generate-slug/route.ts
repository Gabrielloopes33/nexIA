import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * POST /api/organizations/generate-slug
 * 
 * Gera um slug único automaticamente baseado no nome fornecido.
 */
export async function POST(request: Request) {
  try {
    await getAuthenticatedUser()

    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório para gerar o slug' },
        { status: 400 }
      )
    }

    // Gera o slug base
    const baseSlug = generateSlug(name)

    // Verifica se o slug existe e adiciona sufixo numérico se necessário
    const uniqueSlug = await generateUniqueSlug(baseSlug)

    return NextResponse.json({
      success: true,
      slug: uniqueSlug,
    })
  } catch (error) {
    console.error('[API] Erro ao gerar slug:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao gerar slug' },
      { status: 500 }
    )
  }
}

/**
 * Gera um slug base a partir de um nome
 * - Converte para lowercase
 * - Remove acentos
 * - Substitui espaços por hífen
 * - Remove caracteres especiais
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais (mantém espaços e hífens)
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
}

/**
 * Gera um slug único verificando no banco de dados
 * Se o slug existir, adiciona um sufixo numérico (-2, -3, etc.)
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  // Primeiro tenta o slug base
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    // Se existe, tenta com sufixo numérico
    slug = `${baseSlug}-${counter}`
    counter++

    // Previne loop infinito (limite de 1000 tentativas)
    if (counter > 1002) {
      throw new Error('Não foi possível gerar um slug único')
    }
  }
}
