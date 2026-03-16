"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface Contact {
  id: string
  organizationId: string
  phone: string
  name?: string | null
  avatarUrl?: string | null
  metadata?: Record<string, unknown> | null
  tags: string[]
  leadScore: number
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  lastInteractionAt?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    conversations: number
    deals: number
  }
}

interface UseContactsOptions {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  search?: string
  tags?: string[]
  includeDeleted?: boolean
  limit?: number
  offset?: number
}

interface UseContactsReturn {
  contacts: Contact[]
  total: number
  isLoading: boolean
  error: string | null
  refreshContacts: () => Promise<void>
  createContact: (data: Partial<Contact>) => Promise<Contact | null>
  updateContact: (id: string, data: Partial<Contact>) => Promise<Contact | null>
  deleteContact: (id: string) => Promise<boolean>
  restoreContact: (id: string) => Promise<Contact | null>
}

export function useContacts(
  organizationId?: string,
  options: UseContactsOptions = {}
): UseContactsReturn {
  // Usa organizationId do contexto se não for passado explicitamente
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQueryString = () => {
    const params = new URLSearchParams()
    if (effectiveOrgId) params.append('organizationId', effectiveOrgId)
    if (options.status) params.append('status', options.status)
    if (options.search) params.append('search', options.search)
    if (options.tags?.length) params.append('tags', options.tags.join(','))
    if (options.includeDeleted) params.append('includeDeleted', 'true')
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    return params.toString()
  }

  const fetchContacts = useCallback(async () => {
    if (!organizationId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/contacts?${buildQueryString()}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar contatos')
      }
      
      setContacts(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId, JSON.stringify(options)])

  const createContact = async (contactData: Partial<Contact>): Promise<Contact | null> => {
    if (!effectiveOrgId) return null
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactData, organizationId: effectiveOrgId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar contato')
      }
      
      await fetchContacts()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar contato')
      return null
    }
  }

  const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar contato')
      }
      
      await fetchContacts()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar contato')
      return null
    }
  }

  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir contato')
      }
      
      await fetchContacts()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir contato')
      return false
    }
  }

  const restoreContact = async (id: string): Promise<Contact | null> => {
    try {
      const response = await fetch(`/api/contacts/${id}/restore`, {
        method: 'PATCH',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao restaurar contato')
      }
      
      await fetchContacts()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar contato')
      return null
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return {
    contacts,
    total,
    isLoading,
    error,
    refreshContacts: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    restoreContact,
  }
}
