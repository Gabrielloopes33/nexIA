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

      // 1. Pega o usuário logado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error("Usuário não autenticado")
      }

      // 2. Busca a organização do usuário na tabela public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      if (userError || !userData?.organization_id) {
        throw new Error("Organização não encontrada para o usuário")
      }

      // 3. Busca os dados da organização (pode falhar por RLS no client)
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, slug, status")
        .eq("id", userData.organization_id)
        .single()

      // Se RLS bloquear a query, usa o ID que já temos da tabela users
      setOrganization(orgData || {
        id: userData.organization_id,
        name: "",
        slug: "",
        status: "ACTIVE",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      setOrganization(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()

    // Atualiza quando o estado de auth mudar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchOrganization()
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
