/**
 * Client-side authentication utilities
 * 
 * Estes helpers são usados no cliente (browser) para ler dados básicos da sessão
 * a partir do cookie `nexia_user`, que é legível no cliente (não httpOnly).
 * O token JWT seguro permanece no cookie `nexia_session` (httpOnly).
 */

/**
 * Interface do cookie de usuário legível no cliente
 */
export interface UserCookie {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  setupComplete: boolean
  expiresAt: number
}

/**
 * Obtém o valor de um cookie pelo nome.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\[\]\\/+/^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Obtém os dados do usuário do cookie `nexia_user`.
 * 
 * @returns O payload decodificado ou null
 */
export function getUserCookie(): UserCookie | null {
  const value = getCookie('nexia_user')
  if (!value) return null
  try {
    return JSON.parse(value) as UserCookie
  } catch {
    return null
  }
}

/**
 * Obtém o ID da organização do cookie de sessão.
 * 
 * @returns O organizationId ou null
 */
export function getOrganizationIdFromSession(): string | null {
  return getUserCookie()?.organizationId ?? null
}

/**
 * Obtém o ID do usuário do cookie de sessão.
 * 
 * @returns O userId ou null
 */
export function getUserIdFromSession(): string | null {
  return getUserCookie()?.userId ?? null
}

/**
 * Verifica se o usuário está autenticado (cookie existe).
 * 
 * @returns true se autenticado
 */
export function isAuthenticated(): boolean {
  return getUserCookie() !== null
}

/**
 * Verifica se a sessão está expirada.
 * 
 * @returns true se expirada
 */
export function isSessionExpired(): boolean {
  const cookie = getUserCookie()
  if (!cookie) return true
  return cookie.expiresAt < Date.now()
}
