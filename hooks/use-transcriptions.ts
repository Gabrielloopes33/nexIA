"use client"

import useSWR, { mutate as globalMutate } from 'swr'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export type TranscriptionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type TranscriptionSource = 'WHATSAPP_CALL' | 'WHATSAPP_AUDIO' | 'PHONE_CALL' | 'MEETING' | 'UPLOAD'

export interface Transcription {
  id: string
  contactId?: string
  conversationId?: string
  source: TranscriptionSource
  sourceId?: string
  title?: string
  duration?: number // seconds
  status: TranscriptionStatus
  transcript?: string
  summary?: string
  sentiment?: string
  sentimentScore?: number
  objections?: any[]
  keyTopics: string[]
  actionItems: string[]
  converted?: boolean
  resolutionDays?: number
  audioUrl?: string
  audioSize?: number
  audioFormat?: string
  recordedAt?: string
  processedAt?: string
  createdAt: string
  contact?: { id: string; name: string; phone: string; avatarUrl?: string }
}

export interface TranscriptionAnalytics {
  totalTranscriptions: number
  totalDuration: number
  averageDuration: number
  completedCount: number
  pendingCount: number
  failedCount: number
  conversionRate: number
  averageResolutionDays: number
  bySource: Record<TranscriptionSource, number>
  byStatus: Record<TranscriptionStatus, number>
  dailyStats: {
    date: string
    count: number
    duration: number
  }[]
}

export interface TranscriptionFilters {
  contactId?: string
  status?: TranscriptionStatus
  source?: TranscriptionSource
  converted?: boolean
  limit?: number
  offset?: number
}

export interface CreateTranscriptionData {
  contactId?: string
  conversationId?: string
  source: TranscriptionSource
  sourceId?: string
  title?: string
  duration?: number
  audioUrl?: string
  audioSize?: number
  audioFormat?: string
  recordedAt?: string
}

export interface UpdateTranscriptionData {
  title?: string
  transcript?: string
  summary?: string
  sentiment?: string
  sentimentScore?: number
  objections?: any[]
  keyTopics?: string[]
  actionItems?: string[]
  converted?: boolean
  resolutionDays?: number
  status?: TranscriptionStatus
}

interface UseTranscriptionsReturn {
  transcriptions: Transcription[]
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
  createTranscription: (data: CreateTranscriptionData) => Promise<Transcription | null>
  updateTranscription: (id: string, data: UpdateTranscriptionData) => Promise<Transcription | null>
  deleteTranscription: (id: string) => Promise<boolean>
  getAnalytics: (period?: string) => Promise<TranscriptionAnalytics | null>
}

interface TranscriptionResponse {
  success: boolean
  data: Transcription | Transcription[]
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

interface AnalyticsResponse {
  success: boolean
  data: TranscriptionAnalytics
  error?: string
}

// SWR fetcher
const fetcher = async (url: string): Promise<Transcription[]> => {
  const response = await fetch(url)
  const data: TranscriptionResponse = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao carregar transcrições')
  }

  return Array.isArray(data.data) ? data.data : []
}

export function useTranscriptions(
  filters: TranscriptionFilters = {}
): UseTranscriptionsReturn {
  const orgIdFromContext = useOrganizationId()

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams()
    if (orgIdFromContext) params.append('organizationId', orgIdFromContext)
    if (filters.contactId) params.append('contactId', filters.contactId)
    if (filters.status) params.append('status', filters.status)
    if (filters.source) params.append('source', filters.source)
    if (filters.converted !== undefined) params.append('converted', filters.converted.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    return params.toString()
  }

  const queryString = buildQueryString()
  const cacheKey = `/api/transcriptions?${queryString}`

  const { data: transcriptions = [], error, isLoading } = useSWR(
    orgIdFromContext ? cacheKey : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
    }
  )

  const mutate = async () => {
    await globalMutate(cacheKey)
  }

  const createTranscription = async (
    data: CreateTranscriptionData
  ): Promise<Transcription | null> => {
    if (!orgIdFromContext) return null

    try {
      const optimisticTranscription: Transcription = {
        id: `temp-${Date.now()}`,
        ...data,
        status: 'PENDING',
        keyTopics: [],
        actionItems: [],
        createdAt: new Date().toISOString(),
      }

      // Optimistic update
      await globalMutate(
        cacheKey,
        async (current: Transcription[] = []) => {
          return [optimisticTranscription, ...current]
        },
        { revalidate: false }
      )

      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId: orgIdFromContext }),
      })

      const result: TranscriptionResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar transcrição')
      }

      // Revalidate to get the real data
      await globalMutate(cacheKey)

      return result.data as Transcription
    } catch (err) {
      // Rollback on error
      await globalMutate(cacheKey)
      throw err
    }
  }

  const updateTranscription = async (
    id: string,
    data: UpdateTranscriptionData
  ): Promise<Transcription | null> => {
    try {
      // Optimistic update
      await globalMutate(
        cacheKey,
        async (current: Transcription[] = []) => {
          return current.map((t) =>
            t.id === id ? { ...t, ...data } : t
          )
        },
        { revalidate: false }
      )

      const response = await fetch(`/api/transcriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result: TranscriptionResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar transcrição')
      }

      // Revalidate to get the real data
      await globalMutate(cacheKey)

      return result.data as Transcription
    } catch (err) {
      // Rollback on error
      await globalMutate(cacheKey)
      throw err
    }
  }

  const deleteTranscription = async (id: string): Promise<boolean> => {
    try {
      // Optimistic update - remove from list
      await globalMutate(
        cacheKey,
        async (current: Transcription[] = []) => {
          return current.filter((t) => t.id !== id)
        },
        { revalidate: false }
      )

      const response = await fetch(`/api/transcriptions/${id}`, {
        method: 'DELETE',
      })

      const result: TranscriptionResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao excluir transcrição')
      }

      // Revalidate to confirm deletion
      await globalMutate(cacheKey)

      return true
    } catch (err) {
      // Rollback on error
      await globalMutate(cacheKey)
      throw err
    }
  }

  const getAnalytics = async (
    period?: string
  ): Promise<TranscriptionAnalytics | null> => {
    if (!orgIdFromContext) return null

    try {
      const params = new URLSearchParams()
      params.append('organizationId', orgIdFromContext)
      if (period) params.append('period', period)

      const response = await fetch(
        `/api/transcriptions/analytics?${params.toString()}`
      )
      const result: AnalyticsResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar analytics')
      }

      return result.data
    } catch (err) {
      console.error('Erro ao buscar analytics:', err)
      return null
    }
  }

  return {
    transcriptions,
    isLoading,
    error: error || null,
    mutate,
    createTranscription,
    updateTranscription,
    deleteTranscription,
    getAnalytics,
  }
}

// Hook for single transcription
export function useTranscription(id: string | null) {
  const orgIdFromContext = useOrganizationId()
  const cacheKey = id ? `/api/transcriptions/${id}` : null

  const { data: transcription, error, isLoading } = useSWR(
    cacheKey && orgIdFromContext ? cacheKey : null,
    async (url: string): Promise<Transcription | null> => {
      const response = await fetch(url)
      const result: TranscriptionResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar transcrição')
      }

      return Array.isArray(result.data) ? result.data[0] : result.data
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    transcription,
    isLoading,
    error: error || null,
    mutate: async () => {
      if (cacheKey) await globalMutate(cacheKey)
    },
  }
}
