/**
 * Helpers de autenticação para uso em API routes
 * 
 * Estes helpers extraem e validam o usuário autenticado a partir do cookie
 * 'nexia_session'. Eles devem ser usados em todas as API routes protegidas.
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

// Interface do payload do JWT (deve corresponder ao SessionPayload em session.ts)
interface SessionPayload {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  setupComplete: boolean
  expiresAt: number
}

/**
 * Obtém o secret de autenticação das variáveis de ambiente
 */
function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET não configurado')
  }
  return secret
}

/**
 * Verifica a assinatura HMAC do token JWT
 */
function verifyToken(token: string): SessionPayload | null {
  try {
    const [encoded, sig] = token.split('.')
    if (!encoded || !sig) return null

    // Verifica assinatura
    const expected = createHmac('sha256', getSecret())
      .update(encoded)
      .digest('base64url')
    
    if (sig !== expected) return null

    // Decodifica payload
    const payload: SessionPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    )

    // Verifica expiração
    if (payload.expiresAt < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

/**
 * Extrai o token do cookie 'nexia_session'
 */
async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('nexia_session')?.value ?? null
}

/**
 * Extrai o token do request (para uso em middleware ou API routes com request)
 */
function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get('nexia_session')?.value ?? null
}

/**
 * Resultado da autenticação
 */
export interface AuthResult {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  setupComplete: boolean
}

/**
 * Erro de autenticação
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Obtém o usuário autenticado a partir do cookie de sessão.
 * 
 * @returns Dados do usuário autenticado
 * @throws AuthError se não houver sessão válida
 * 
 * @example
 * ```typescript
 * // Em uma API route
 * export async function GET() {
 *   try {
 *     const user = await getAuthenticatedUser()
 *     // ... usa user.userId, user.email, etc.
 *   } catch (error) {
 *     if (error instanceof AuthError) {
 *       return NextResponse.json({ error: error.message }, { status: error.statusCode })
 *     }
 *   }
 * }
 * ```
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const token = await getTokenFromCookie()
  
  if (!token) {
    throw new AuthError('Não autenticado', 401)
  }

  const payload = verifyToken(token)
  
  if (!payload) {
    throw new AuthError('Sessão inválida', 401)
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    organizationId: payload.organizationId,
    setupComplete: payload.setupComplete,
  }
}

/**
 * Obtém o usuário autenticado a partir de um request (para middleware).
 * 
 * @param req - O request Next.js
 * @returns Dados do usuário autenticado
 * @throws AuthError se não houver sessão válida
 */
export function getAuthenticatedUserFromRequest(req: NextRequest): AuthResult {
  const token = getTokenFromRequest(req)
  
  if (!token) {
    throw new AuthError('Não autenticado', 401)
  }

  const payload = verifyToken(token)
  
  if (!payload) {
    throw new AuthError('Sessão inválida', 401)
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    organizationId: payload.organizationId,
    setupComplete: payload.setupComplete,
  }
}

/**
 * Obtém o ID da organização do usuário autenticado.
 * 
 * @returns ID da organização
 * @throws AuthError se não houver sessão válida ou organização
 * 
 * @example
 * ```typescript
 * // Em uma API route
 * export async function POST(request: Request) {
 *   try {
 *     const organizationId = await getOrganizationId()
 *     // ... usa organizationId nas queries
 *   } catch (error) {
 *     if (error instanceof AuthError) {
 *       return NextResponse.json({ error: error.message }, { status: error.statusCode })
 *     }
 *   }
 * }
 * ```
 */
export async function getOrganizationId(): Promise<string> {
  const user = await getAuthenticatedUser()
  
  if (!user.organizationId) {
    throw new AuthError('Usuário não possui organização', 403)
  }

  return user.organizationId
}

/**
 * Obtém o ID da organização a partir de um request.
 * 
 * @param req - O request Next.js
 * @returns ID da organização
 * @throws AuthError se não houver sessão válida ou organização
 */
export function getOrganizationIdFromRequest(req: NextRequest): string {
  const user = getAuthenticatedUserFromRequest(req)
  
  if (!user.organizationId) {
    throw new AuthError('Usuário não possui organização', 403)
  }

  return user.organizationId
}

/**
 * Interface estendida com informações de membership
 */
export interface AuthWithMembership extends AuthResult {
  membership: {
    id: string
    role: string
    status: string
  }
}

/**
 * Verifica se o usuário autenticado é membro da organização especificada.
 * 
 * @param organizationId - ID da organização a verificar
 * @returns Dados do usuário com membership
 * @throws AuthError se não for membro
 */
export async function requireOrganizationMembership(
  organizationId: string
): Promise<AuthWithMembership> {
  const user = await getAuthenticatedUser()

  // Verifica se o usuário é membro da organização
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: user.userId,
      organizationId,
      status: 'ACTIVE',
    },
  })

  if (!membership) {
    throw new AuthError('Acesso negado à organização', 403)
  }

  return {
    ...user,
    membership: {
      id: membership.id,
      role: membership.role,
      status: membership.status,
    },
  }
}

/**
 * Verifica se o usuário tem uma das roles permitidas.
 * 
 * @param membership - Dados do membership
 * @param allowedRoles - Lista de roles permitidas
 * @throws AuthError se não tiver permissão
 */
export function requireRole(
  membership: { role: string },
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(membership.role)) {
    throw new AuthError('Permissão insuficiente', 403)
  }
}

/**
 * Helper para criar resposta de erro de autenticação.
 * 
 * @param error - O erro de autenticação
 * @returns NextResponse com o erro formatado
 */
export function createAuthErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json(
    { 
      error: error.message,
      code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    },
    { status: error.statusCode }
  )
}

/**
 * Wrapper para API routes que requerem autenticação.
 * 
 * @param handler - Função handler da API route
 * @returns Handler envolvido com autenticação
 * 
 * @example
 * ```typescript
 * // Em uma API route
 * export const GET = withAuth(async (user, request) => {
 *   // user contém userId, email, name, organizationId
 *   const data = await prisma.contact.findMany({
 *     where: { organizationId: user.organizationId }
 *   })
 *   return NextResponse.json(data)
 * })
 * ```
 */
export function withAuth<T extends (user: AuthResult, request: Request) => Promise<NextResponse>>(
  handler: T
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser()
      return handler(user, request)
    } catch (error) {
      if (error instanceof AuthError) {
        return createAuthErrorResponse(error)
      }
      throw error
    }
  }
}

/**
 * Wrapper para API routes que requerem autenticação e membership.
 * 
 * @param handler - Função handler da API route
 * @returns Handler envolvido com autenticação e validação de membership
 */
export function withOrganizationAuth<T extends (auth: AuthWithMembership, request: Request) => Promise<NextResponse>>(
  handler: T
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const organizationId = await getOrganizationId()
      const auth = await requireOrganizationMembership(organizationId)
      return handler(auth, request)
    } catch (error) {
      if (error instanceof AuthError) {
        return createAuthErrorResponse(error)
      }
      throw error
    }
  }
}

// ============================================================================
// FUNÇÕES PARA RBAC (Fase 3)
// ============================================================================

import { OrganizationRole, MemberStatus } from '@prisma/client'

/**
 * Interface do membro para RBAC
 */
export interface CurrentMember {
  id: string
  organizationId: string
  userId: string
  role: OrganizationRole
  status: MemberStatus
}

/**
 * Obtém o membro atual da organização a partir do request.
 * 
 * @param req - O request Next.js
 * @returns Dados do membro ou null se não for membro
 */
export async function getCurrentMember(req: NextRequest): Promise<CurrentMember | null> {
  try {
    const user = getAuthenticatedUserFromRequest(req)
    
    if (!user.organizationId) {
      return null
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId: user.organizationId,
      },
    })

    if (!membership) {
      return null
    }

    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
    }
  } catch {
    return null
  }
}
