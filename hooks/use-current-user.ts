"use client"

import { useState, useEffect } from "react"

interface CurrentUser {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  setupComplete: boolean
}

interface UseCurrentUserReturn {
  user: CurrentUser | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook para buscar os dados do usuário logado.
 * Útil em Client Components que precisam do userId quando o cookie
 * `nexia_session` é httpOnly e não pode ser lido diretamente.
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "same-origin",
        })

        if (!res.ok) {
          throw new Error("Falha ao carregar dados do usuário")
        }

        const data = await res.json()
        if (!cancelled) {
          setUser(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Erro desconhecido"))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchUser()
    return () => { cancelled = true }
  }, [])

  return { user, isLoading, error }
}
