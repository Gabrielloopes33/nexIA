/**
 * Client-side authentication utilities
 * 
 * Estes helpers são usados no cliente (browser) para decodificar o token JWT
 * sem verificar a assinatura (apenas para leitura de dados não sensíveis).
 */

/**
 * Interface do payload da sessão (deve corresponder ao SessionPayload do servidor)
 */
export interface SessionPayload {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  expiresAt: number
}

/**
 * Decodifica um token JWT base64url sem verificar a assinatura.
 * 
 * ⚠️ ATENÇÃO: Use apenas para leitura de dados não sensíveis no cliente.
 * A verificação da assinatura deve ser feita apenas no servidor.
 * 
 * @param token - O token JWT
 * @returns O payload decodificado ou null se inválido
 */
export function decodeJwtUnsafe(token: string): SessionPayload | null {
  try {
    const [encoded] = token.split('.')
    if (!encoded) return null

    const payload: SessionPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    )

    // Verifica expiração (pode ser verificado no cliente para UX)
    if (payload.expiresAt < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

/**
 * Obtém o token do cookie 'nexia_session'.
 * 
 * @returns O token ou null se não existir
 */
export function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const match = document.cookie.match(/nexia_session=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Obtém o payload da sessão do cookie.
 * 
 * @returns O payload decodificado ou null
 */
export function getSessionPayload(): SessionPayload | null {
  const token = getSessionToken()
  if (!token) return null
  return decodeJwtUnsafe(token)
}

/**
 * Obtém o ID da organização do cookie de sessão.
 * 
 * @returns O organizationId ou null
 */
export function getOrganizationIdFromSession(): string | null {
  const payload = getSessionPayload()
  return payload?.organizationId ?? null
}

/**
 * Obtém o ID do usuário do cookie de sessão.
 * 
 * @returns O userId ou null
 */
export function getUserIdFromSession(): string | null {
  const payload = getSessionPayload()
  return payload?.userId ?? null
}

/**
 * Verifica se o usuário está autenticado (token existe e não expirou).
 * 
 * @returns true se autenticado
 */
export function isAuthenticated(): boolean {
  return getSessionPayload() !== null
}

/**
 * Verifica se a sessão está expirada.
 * 
 * @returns true se expirada
 */
export function isSessionExpired(): boolean {
  const payload = getSessionPayload()
  if (!payload) return true
  return payload.expiresAt < Date.now()
}
