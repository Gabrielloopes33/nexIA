"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface Tag {
  id: string
  organizationId: string
  name: string
  color: string
  description?: string | null
  source: string
  createdAt: string
  updatedAt: string
  _count?: {
    contactTags: number
  }
}

interface UseTagsReturn {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  refreshTags: () => Promise<void>
  createTag: (data: Partial<Tag>) => Promise<Tag | null>
  updateTag: (id: string, data: Partial<Tag>) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<boolean>
  assignTagToContact: (contactId: string, tagId: string) => Promise<boolean>
  removeTagFromContact: (contactId: string, tagId: string) => Promise<boolean>
}

export function useTags(organizationId?: string): UseTagsReturn {
  // Usa organizationId do contexto se não for passado explicitamente
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    console.log('[useTags] fetchTags called, effectiveOrgId:', effectiveOrgId)
    if (!effectiveOrgId) {
      console.log('[useTags] No effectiveOrgId, skipping fetch')
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const url = `/api/tags?organizationId=${effectiveOrgId}`
      console.log('[useTags] Fetching:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('[useTags] Response:', response.status, data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar tags')
      }
      
      setTags(data.data || [])
    } catch (err) {
      console.error('[useTags] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar tags')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId])

  const createTag = async (tagData: Partial<Tag>): Promise<Tag | null> => {
    console.log('[useTags] createTag called:', tagData)
    if (!effectiveOrgId) {
      console.log('[useTags] createTag: No effectiveOrgId')
      return null
    }
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tagData, organizationId: effectiveOrgId }),
      })
      
      const data = await response.json()
      console.log('[useTags] createTag response:', response.status, data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar tag')
      }
      
      await fetchTags()
      return data.data
    } catch (err) {
      console.error('[useTags] createTag error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar tag')
      return null
    }
  }

  const updateTag = async (id: string, tagData: Partial<Tag>): Promise<Tag | null> => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar tag')
      }
      
      await fetchTags()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tag')
      return null
    }
  }

  const deleteTag = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir tag')
      }
      
      await fetchTags()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tag')
      return false
    }
  }

  const assignTagToContact = async (contactId: string, tagId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atribuir tag')
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir tag')
      return false
    }
  }

  const removeTagFromContact = async (contactId: string, tagId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover tag')
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover tag')
      return false
    }
  }

  // Track last fetched orgId to prevent loops from parent context re-renders
  const lastFetchedOrgId = useRef<string | null>(null)
  
  useEffect(() => {
    if (effectiveOrgId && effectiveOrgId !== lastFetchedOrgId.current) {
      fetchTags()
      lastFetchedOrgId.current = effectiveOrgId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOrgId])

  return {
    tags,
    isLoading,
    error,
    refreshTags: fetchTags,
    createTag,
    updateTag,
    deleteTag,
    assignTagToContact,
    removeTagFromContact,
  }
}
