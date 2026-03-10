import { createHmac, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'nexia_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

export interface SessionPayload {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  expiresAt: number
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return secret
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

function verify(token: string): SessionPayload | null {
  try {
    const [encoded, sig] = token.split('.')
    if (!encoded || !sig) return null
    const expected = createHmac('sha256', getSecret()).update(encoded).digest('base64url')
    if (sig !== expected) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const full: SessionPayload = { ...payload, expiresAt: Date.now() + SESSION_DURATION_MS }
  const token = sign(full)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verify(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verify(token)
}
