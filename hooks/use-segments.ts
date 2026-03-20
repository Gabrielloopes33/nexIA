"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface SegmentRule {
  id: string
  field: string
  operator: string
  value: string
}

export interface Segment {
  id: string
  organizationId: string
  name: string
  description: string | null
  rules: SegmentRule[]
  contactCount: number
  lastCalculatedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface UseSegmentsReturn {
  segments: Segment[]
  isLoading: boolean
  error: string | null
  refreshSegments: () => Promise<void>
  createSegment: (data: Partial<Segment>) => Promise<Segment | null>
  updateSegment: (id: string, data: Partial<Segment>) => Promise<Segment | null>
  deleteSegment: (id: string) => Promise<boolean>
}

export function useSegments(organizationId?: string): UseSegmentsReturn {
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [segments, setSegments] = useState<Segment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSegments = useCallback(async () => {
    if (!effectiveOrgId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/segments?organizationId=${effectiveOrgId}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar segmentos')
      }
      
      setSegments(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar segmentos')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId])

  const createSegment = async (segmentData: Partial<Segment>): Promise<Segment | null> => {
    if (!effectiveOrgId) return null
    
    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...segmentData, organizationId: effectiveOrgId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar segmento')
      }
      
      await fetchSegments()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar segmento')
      return null
    }
  }

  const updateSegment = async (id: string, segmentData: Partial<Segment>): Promise<Segment | null> => {
    try {
      const response = await fetch(`/api/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar segmento')
      }
      
      await fetchSegments()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar segmento')
      return null
    }
  }

  const deleteSegment = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/segments/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir segmento')
      }
      
      await fetchSegments()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir segmento')
      return false
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])

  return {
    segments,
    isLoading,
    error,
    refreshSegments: fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
  }
}
