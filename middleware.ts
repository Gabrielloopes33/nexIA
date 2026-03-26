import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'nexia_session'
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/setup-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/setup-password',
  '/api/auth/test-login',
  '/api/whatsapp/webhooks',
  '/api/instagram/webhooks',
  '/api/stripe/webhook',
  '/api/evolution/webhook',
]

const PUBLIC_PREFIXES = ['/_next/', '/images/', '/fonts/', '/favicon']

interface SessionPayload {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  setupComplete?: boolean
  expiresAt: number
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

/**
 * Decodifica o token JWT (apenas payload, sem verificar assinatura no middleware)
 * A verificação completa é feita nas API routes
 */
function decodeToken(token: string): SessionPayload | null {
  try {
    const [encoded] = token.split('.')
    if (!encoded) return null

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

function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeToken(token)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permite rotas públicas
  if (isPublic(pathname)) return NextResponse.next()

  // Permite rotas de API de onboarding
  if (pathname.startsWith('/api/user/onboarding-status')) {
    return NextResponse.next()
  }

  // Verifica se o usuário está autenticado via cookie 'nexia_session'
  const session = getSessionFromRequest(req)

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se o usuário não tem organizationId, redireciona para onboarding
  if (!session.organizationId) {
    if (!pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding/organizacao', req.url))
    }
    return NextResponse.next()
  }

  const setupComplete = session.setupComplete

  // Não completou onboarding e não está na página de onboarding
  if (setupComplete === false && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding/organizacao', req.url))
  }

  // Já completou onboarding mas está tentando acessar página de onboarding de organização
  if (setupComplete === true && pathname.startsWith('/onboarding/organizacao')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Permite acesso a /onboarding/bem-vindo mesmo após completar onboarding
  // (para permitir que o usuário veja a página de boas-vindas uma vez)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
