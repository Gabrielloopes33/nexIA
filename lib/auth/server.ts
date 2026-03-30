/**
 * Server-side authentication utilities
 * For use in API routes and server components
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest, SessionPayload } from './session'
import { createHmac } from 'crypto'

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
 * Assina um token JWT
 */
export async function signToken(payload: Omit<SessionPayload, 'expiresAt'> & { expiresAt: number }): Promise<string> {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

/**
 * Require authentication for API routes
 * Returns the session if valid, or sends a 401 response if not
 */
export async function requireAuth(
  req: NextRequest
): Promise<SessionPayload | NextResponse> {
  const session = getSessionFromRequest(req)
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return session
}

/**
 * Get current session without requiring authentication
 * Returns null if no valid session exists
 */
export function getAuthSession(req: NextRequest): SessionPayload | null {
  return getSessionFromRequest(req)
}

/**
 * Check if user has required role
 */
export function hasRole(
  session: SessionPayload,
  allowedRoles: string[]
): boolean {
  // For now, all authenticated users have access
  // This can be extended with role checking when roles are implemented
  return true
}
