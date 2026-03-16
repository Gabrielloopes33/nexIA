"use client"

import useSWR, { SWRConfiguration, KeyedMutator } from 'swr'
import { useCallback } from 'react'

export type AiInsightType = 'PREDICTION' | 'ALERT' | 'RECOMMENDATION' | 'DISCOVERY'
export type AiInsightStatus = 'ACTIVE' | 'DISMISSED' | 'ARCHIVED'

export interface AiInsight {
  id: string
  type: AiInsightType
  category: string
  title: string
  description: string
  value?: string
  confidence?: number
  metadata?: any
  relatedContactIds: string[]
  relatedDealIds: string[]
  status: AiInsightStatus
  action?: string
  actionUrl?: string
  clickedAt?: string
  dismissedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AiInsightsStats {
  total: number
  byType: Record<AiInsightType, number>
  byStatus: Record<AiInsightStatus, number>
  byCategory: Record<string, number>
  highConfidence: number
  averageConfidence: number
}

export interface AiInsightsListResponse {
  data: AiInsight[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface UseAiInsightsOptions {
  type?: AiInsightType
  status?: AiInsightStatus
  category?: string
  limit?: number
  offset?: number
  swrOptions?: SWRConfiguration
}

export interface UseAiInsightsReturn {
  insights: AiInsight[]
  total: number
  isLoading: boolean
  error: Error | null
  mutate: KeyedMutator<AiInsightsListResponse>
  createInsight: (data: Partial<AiInsight>) => Promise<AiInsight | null>
  updateInsight: (id: string, data: Partial<AiInsight>) => Promise<AiInsight | null>
  deleteInsight: (id: string) => Promise<boolean>
  getStats: () => Promise<AiInsightsStats | null>
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<AiInsightsListResponse> => {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao carregar insights')
  }
  
  return data
}

// Helper to get organization ID from context or storage
function getOrganizationId(): string | null {
  // Try to get from localStorage first (client-side only)
  if (typeof window !== 'undefined') {
    const orgId = localStorage.getItem('organizationId')
    if (orgId) return orgId
  }
  return null
}

export function useAiInsights(options: UseAiInsightsOptions = {}): UseAiInsightsReturn {
  const {
    type,
    status,
    category,
    limit = 20,
    offset = 0,
    swrOptions = {},
  } = options

  const organizationId = getOrganizationId()

  // Build query string
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (status) params.append('status', status)
    if (category) params.append('category', category)
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    return params.toString()
  }, [type, status, category, limit, offset])

  const queryString = buildQueryString()
  const key = organizationId ? `/api/ai-insights?${queryString}` : null

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<AiInsightsListResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      ...swrOptions,
    }
  )

  // Create a new insight
  const createInsight = useCallback(async (
    insightData: Partial<AiInsight>
  ): Promise<AiInsight | null> => {
    if (!organizationId) return null

    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insightData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar insight')
      }

      // Optimistically update the cache
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          return {
            ...currentData,
            data: [result.data, ...currentData.data],
            pagination: {
              ...currentData.pagination,
              total: currentData.pagination.total + 1,
            },
          }
        },
        { revalidate: false }
      )

      return result.data
    } catch (err) {
      console.error('Error creating insight:', err)
      return null
    }
  }, [organizationId, mutate])

  // Update an existing insight
  const updateInsight = useCallback(async (
    id: string,
    insightData: Partial<AiInsight>
  ): Promise<AiInsight | null> => {
    try {
      const response = await fetch(`/api/ai-insights/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insightData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar insight')
      }

      // Optimistically update the cache
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          return {
            ...currentData,
            data: currentData.data.map((insight) =>
              insight.id === id ? { ...insight, ...result.data } : insight
            ),
          }
        },
        { revalidate: false }
      )

      return result.data
    } catch (err) {
      console.error('Error updating insight:', err)
      return null
    }
  }, [mutate])

  // Delete an insight
  const deleteInsight = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/ai-insights/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao excluir insight')
      }

      // Optimistically update the cache
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          return {
            ...currentData,
            data: currentData.data.filter((insight) => insight.id !== id),
            pagination: {
              ...currentData.pagination,
              total: currentData.pagination.total - 1,
            },
          }
        },
        { revalidate: false }
      )

      return true
    } catch (err) {
      console.error('Error deleting insight:', err)
      return false
    }
  }, [mutate])

  // Get statistics
  const getStats = useCallback(async (): Promise<AiInsightsStats | null> => {
    if (!organizationId) return null

    try {
      const response = await fetch('/api/ai-insights/stats')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar estatísticas')
      }

      return result.data
    } catch (err) {
      console.error('Error fetching stats:', err)
      return null
    }
  }, [organizationId])

  return {
    insights: data?.data || [],
    total: data?.pagination?.total || 0,
    isLoading,
    error: error || null,
    mutate,
    createInsight,
    updateInsight,
    deleteInsight,
    getStats,
  }
}

export default useAiInsights
