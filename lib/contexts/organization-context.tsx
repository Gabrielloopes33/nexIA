"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

interface Organization {
  id: string
  name: string
  slug: string
  status: string
}

interface OrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  error: Error | null
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

/**
 * Provider de contexto de organização.
 * 
 * Busca a organização do usuário autenticado via API.
 * Se o usuário não tiver organização, tenta fazer refresh da sessão.
 */
export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrganization = useCallback(async (attemptRefresh = true): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Busca a organização via API (o cookie httpOnly é enviado automaticamente)
      const response = await fetch("/api/organization/me", {
        credentials: 'same-origin'
      })

      if (response.ok) {
        const org = await response.json()
        setOrganization(org)
        return
      }

      // Se não tem organização (404) e ainda não tentou refresh
      if (response.status === 404 && attemptRefresh) {
        console.log('[OrganizationContext] Organização não encontrada, tentando refresh da sessão...')
        
        try {
          const refreshResponse = await fetch('/api/auth/refresh-session', { 
            method: 'POST',
            credentials: 'same-origin'
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            console.log('[OrganizationContext] Sessão atualizada:', refreshData)
            
            // Tenta buscar a organização novamente (sem tentar refresh de novo)
            await fetchOrganization(false)
            return
          } else {
            const errorData = await refreshResponse.json().catch(() => ({}))
            console.log('[OrganizationContext] Refresh falhou:', errorData)
          }
        } catch (refreshError) {
          console.error('[OrganizationContext] Erro no refresh:', refreshError)
        }
        
        // Se chegou aqui, não conseguiu obter organização mesmo após refresh
        setOrganization(null)
        setError(new Error("Usuário não possui organização associada. Contate o administrador."))
        return
      }

      if (response.status === 401) {
        setOrganization(null)
        setError(new Error("Usuário não autenticado"))
        return
      }

      throw new Error("Erro ao carregar organização")
    } catch (err) {
      console.error('[OrganizationContext] Erro:', err)
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      setOrganization(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganization()

    // Atualiza quando a aba ganha foco (pode ter mudado em outra aba)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrganization()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Também verifica periodicamente
    const interval = setInterval(() => {
      fetchOrganization()
    }, 30000) // Verifica a cada 30 segundos

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [fetchOrganization])

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        error,
        refreshOrganization: () => fetchOrganization(),
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

/**
 * Hook para acessar o contexto de organização.
 * 
 * @returns O contexto com organization, isLoading, error e refreshOrganization
 * @throws Erro se usado fora do OrganizationProvider
 */
export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    // Durante SSG/build, retorna estado de loading em vez de lançar erro
    if (typeof window === 'undefined') {
      return {
        organization: null,
        isLoading: true,
        error: null,
        refreshOrganization: async () => {},
      }
    }
    throw new Error("useOrganization deve ser usado dentro de OrganizationProvider")
  }
  return context
}

/**
 * Hook conveniente para obter apenas o ID da organização.
 * 
 * @returns O ID da organização ou null se não estiver carregado
 */
export function useOrganizationId(): string | null {
  const { organization, isLoading } = useOrganization()
  if (isLoading) return null
  return organization?.id || null
}

/**
 * Hook para verificar se o usuário está autenticado e tem organização.
 * 
 * @returns true se estiver autenticado com organização
 */
export function useHasOrganization(): boolean {
  const { organization, isLoading } = useOrganization()
  return !isLoading && organization !== null
}
