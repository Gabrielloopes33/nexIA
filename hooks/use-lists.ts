"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Contact } from './use-contacts'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface List {
  id: string
  organizationId: string
  name: string
  description?: string | null
  filters: Record<string, unknown>
  isDynamic: boolean
  contactCount: number
  createdBy?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    listContacts: number
  }
}

interface UseListsReturn {
  lists: List[]
  isLoading: boolean
  error: string | null
  refreshLists: () => Promise<void>
  createList: (data: Partial<List>) => Promise<List | null>
  updateList: (id: string, data: Partial<List>) => Promise<List | null>
  deleteList: (id: string) => Promise<boolean>
  addContactToList: (listId: string, contactId: string) => Promise<boolean>
  removeContactFromList: (listId: string, contactId: string) => Promise<boolean>
  getListContacts: (listId: string) => Promise<Contact[]>
}

export function useLists(organizationId?: string): UseListsReturn {
  // Usa organizationId do contexto se não for passado explicitamente
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    if (!effectiveOrgId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/lists?organizationId=${effectiveOrgId}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar listas')
      }
      
      setLists(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar listas')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId])

  const createList = async (listData: Partial<List>): Promise<List | null> => {
    if (!effectiveOrgId) return null
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...listData, organizationId: effectiveOrgId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar lista')
      }
      
      await fetchLists()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lista')
      return null
    }
  }

  const updateList = async (id: string, listData: Partial<List>): Promise<List | null> => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar lista')
      }
      
      await fetchLists()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lista')
      return null
    }
  }

  const deleteList = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir lista')
      }
      
      await fetchLists()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir lista')
      return false
    }
  }

  const addContactToList = async (listId: string, contactId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${listId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao adicionar contato à lista')
      }
      
      await fetchLists()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar contato à lista')
      return false
    }
  }

  const removeContactFromList = async (listId: string, contactId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${listId}/contacts/${contactId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover contato da lista')
      }
      
      await fetchLists()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover contato da lista')
      return false
    }
  }

  const getListContacts = async (listId: string): Promise<Contact[]> => {
    try {
      const response = await fetch(`/api/lists/${listId}/contacts`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar contatos da lista')
      }
      
      return data.data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos da lista')
      return []
    }
  }

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  return {
    lists,
    isLoading,
    error,
    refreshLists: fetchLists,
    createList,
    updateList,
    deleteList,
    addContactToList,
    removeContactFromList,
    getListContacts,
  }
}
