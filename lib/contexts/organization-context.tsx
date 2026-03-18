"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getSessionPayload, getOrganizationIdFromSession, isAuthenticated } from "@/lib/auth/client"

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
 * Este provider obtém o organizationId do cookie JWT (client-side) e busca
 * os detalhes da organização via API apenas quando necessário.
 */
export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Verifica se o usuário está autenticado via JWT no cookie
      if (!isAuthenticated()) {
        setOrganization(null)
        setError(new Error("Usuário não autenticado"))
        return
      }

      // Obtém o organizationId do payload JWT (client-side, sem fetch)
      const organizationId = getOrganizationIdFromSession()

      if (!organizationId) {
        setOrganization(null)
        setError(new Error("Organização não encontrada para o usuário"))
        return
      }

      // Busca detalhes da organização via API
      // Isso garante que temos os dados mais atualizados e valida no servidor
      const response = await fetch("/api/organization/me")

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Usuário não autenticado")
        }
        if (response.status === 404) {
          throw new Error("Organização não encontrada para o usuário")
        }
        throw new Error("Erro ao carregar organização")
      }

      const org = await response.json()
      setOrganization(org)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      setOrganization(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganization()

    // Atualiza quando o cookie mudar (outra aba/login/logout)
    const handleStorageChange = () => {
      fetchOrganization()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Também verifica periodicamente se o token mudou
    const interval = setInterval(() => {
      const currentOrgId = organization?.id
      const newOrgId = getOrganizationIdFromSession()
      
      if (newOrgId !== currentOrgId) {
        fetchOrganization()
      }
    }, 5000) // Verifica a cada 5 segundos

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [fetchOrganization, organization?.id])

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        error,
        refreshOrganization: fetchOrganization,
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
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { organization, isLoading, error } = useOrganization()
 *   
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error.message} />
 *   if (!organization) return <NotFound />
 *   
 *   return <div>{organization.name}</div>
 * }
 * ```
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
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const orgId = useOrganizationId()
 *   
 *   if (!orgId) return <Loading />
 *   
 *   return <div>Org ID: {orgId}</div>
 * }
 * ```
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
