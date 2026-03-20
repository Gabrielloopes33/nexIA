"use client"

import { useState, useEffect, useCallback } from "react"

export interface OrganizationMember {
  id: string
  userId: string | null
  name: string
  email: string
  avatarUrl?: string | null
  role: string
  status: string
  joinedAt?: Date | null
  lastAccess?: Date | null
  userStatus?: string | null
}

interface UseOrganizationMembersReturn {
  members: OrganizationMember[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  inviteMember: (data: { name: string; email: string; password: string; role: string }) => Promise<void>
  updateMember: (id: string, data: { role?: string; status?: string }) => Promise<void>
  deleteMember: (id: string) => Promise<void>
}

export function useOrganizationMembers(): UseOrganizationMembersReturn {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/organization/members")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao carregar membros")
      }

      const data = await response.json()
      setMembers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const inviteMember = async (data: { name: string; email: string; role: string }) => {
    const response = await fetch("/api/organization/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erro ao convidar membro")
    }

    await fetchMembers()
  }

  const updateMember = async (id: string, data: { role?: string; status?: string }) => {
    const response = await fetch(`/api/organization/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erro ao atualizar membro")
    }

    await fetchMembers()
  }

  const deleteMember = async (id: string) => {
    const response = await fetch(`/api/organization/members/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erro ao remover membro")
    }

    await fetchMembers()
  }

  return {
    members,
    isLoading,
    error,
    refresh: fetchMembers,
    inviteMember,
    updateMember,
    deleteMember,
  }
}
