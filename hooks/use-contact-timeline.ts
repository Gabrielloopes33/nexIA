"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface TimelineEvent {
  id: string
  type: 'note' | 'call' | 'meeting' | 'task' | 'deal' | 'whatsapp' | 'message'
  title: string
  description?: string
  date: string
  author: string
  authorAvatar?: string
  metadata?: Record<string, unknown>
}

interface UseContactTimelineReturn {
  events: TimelineEvent[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useContactTimeline(
  contactId: string | undefined
): UseContactTimelineReturn {
  const organizationId = useOrganizationId()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeline = useCallback(async () => {
    if (!contactId || !organizationId) return

    setIsLoading(true)
    setError(null)
    try {
      const url = `/api/contacts/${contactId}/timeline?organizationId=${organizationId}&limit=50`
      console.log('[useContactTimeline] Fetching:', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('[useContactTimeline] Response:', { status: response.status, success: data.success, error: data.error, details: data.details })

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Erro ao carregar timeline')
      }

      setEvents(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar timeline')
    } finally {
      setIsLoading(false)
    }
  }, [contactId, organizationId])

  useEffect(() => {
    if (contactId && organizationId) {
      fetchTimeline()
    }
  }, [contactId, organizationId, fetchTimeline])

  return {
    events,
    isLoading,
    error,
    refresh: fetchTimeline,
  }
}
