"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import { QueueStatus } from '@prisma/client'

export interface SchedulingQueueItem {
  id: string
  organizationId: string
  contactId: string
  contact: {
    id: string
    name: string | null
    phone: string
    avatarUrl: string | null
    tags: string[]
    metadata: any
  }
  tagId: string | null
  source: string
  priority: number
  status: QueueStatus
  notes: string | null
  assignedTo: string | null
  assignedUser: {
    id: string
    name: string | null
    email: string
  } | null
  scheduledAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateQueueItemData {
  contactId: string
  tagId?: string
  source?: string
  priority?: number
  notes?: string
  assignedTo?: string
}

export interface ScheduleFromQueueData {
  type: 'meeting' | 'call' | 'task' | 'deadline'
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
}

interface UseSchedulingQueueReturn {
  items: SchedulingQueueItem[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  addToQueue: (data: CreateQueueItemData) => Promise<SchedulingQueueItem | null>
  updateItem: (id: string, data: Partial<CreateQueueItemData>) => Promise<SchedulingQueueItem | null>
  removeFromQueue: (id: string) => Promise<boolean>
  scheduleItem: (id: string, data: ScheduleFromQueueData) => Promise<any | null>
  startProcessing: (id: string) => Promise<SchedulingQueueItem | null>
  completeItem: (id: string) => Promise<SchedulingQueueItem | null>
}

export function useSchedulingQueue(
  status?: QueueStatus
): UseSchedulingQueueReturn {
  const organizationId = useOrganizationId()
  const [items, setItems] = useState<SchedulingQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('organizationId', organizationId)
      if (status) params.append('status', status)

      const response = await fetch(`/api/schedules/queue?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar fila')
      }

      setItems(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fila')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, status])

  const addToQueue = async (data: CreateQueueItemData): Promise<SchedulingQueueItem | null> => {
    if (!organizationId) return null

    try {
      const response = await fetch('/api/schedules/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao adicionar à fila')
      }

      await fetchItems()
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar à fila')
      return null
    }
  }

  const updateItem = async (id: string, data: Partial<CreateQueueItemData>): Promise<SchedulingQueueItem | null> => {
    try {
      const response = await fetch(`/api/schedules/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar item')
      }

      await fetchItems()
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item')
      return null
    }
  }

  const removeFromQueue = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/schedules/queue/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao remover da fila')
      }

      await fetchItems()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover da fila')
      return false
    }
  }

  const scheduleItem = async (id: string, data: ScheduleFromQueueData): Promise<any | null> => {
    try {
      const response = await fetch(`/api/schedules/queue/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao agendar')
      }

      await fetchItems()
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar')
      return null
    }
  }

  const startProcessing = async (id: string): Promise<SchedulingQueueItem | null> => {
    return updateItem(id, { status: 'IN_PROGRESS' as any })
  }

  const completeItem = async (id: string): Promise<SchedulingQueueItem | null> => {
    return updateItem(id, { status: 'COMPLETED' as any })
  }

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return {
    items,
    isLoading,
    error,
    refresh: fetchItems,
    addToQueue,
    updateItem,
    removeFromQueue,
    scheduleItem,
    startProcessing,
    completeItem,
  }
}
