"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchOrganization = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Busca organização via API server-side (bypassa RLS do Supabase)
      const response = await fetch("/api/organization/me")

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Usuário não autenticado")
        }
        throw new Error("Organização não encontrada")
      }

      const org = await response.json()
      setOrganization(org)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      setOrganization(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()

    // Atualiza quando o estado de auth mudar (apenas em eventos relevantes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        fetchOrganization()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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

// Hook conveniente para pegar apenas o ID
export function useOrganizationId(): string | null {
  const { organization, isLoading } = useOrganization()
  if (isLoading) return null
  return organization?.id || null
}
