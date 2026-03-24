"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import { ScheduleType, ScheduleStatus } from '@prisma/client'

export interface Schedule {
  id: string
  organizationId: string
  type: ScheduleType
  title: string
  description: string | null
  contactId: string | null
  contact: {
    id: string
    name: string | null
    phone: string
    avatarUrl: string | null
  } | null
  dealId: string | null
  deal: {
    id: string
    title: string
  } | null
  assignedTo: string | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  startTime: string
  endTime: string
  completedAt: string | null
  status: ScheduleStatus
  location: string | null
  createdAt: string
  updatedAt: string
}

export interface ScheduleFilters {
  type?: ScheduleType
  status?: ScheduleStatus
  startDate?: string
  endDate?: string
  contactId?: string
}

interface UseSchedulesReturn {
  schedules: Schedule[]
  isLoading: boolean
  error: string | null
  refreshSchedules: () => Promise<void>
  createSchedule: (data: CreateScheduleData) => Promise<Schedule | null>
  updateSchedule: (id: string, data: UpdateScheduleData) => Promise<Schedule | null>
  deleteSchedule: (id: string) => Promise<boolean>
  completeSchedule: (id: string) => Promise<Schedule | null>
}

export interface CreateScheduleData {
  type: ScheduleType
  title: string
  description?: string
  contactId?: string
  dealId?: string
  assignedTo?: string
  startTime: string
  endTime: string
  location?: string
}

export interface UpdateScheduleData {
  type?: ScheduleType
  title?: string
  description?: string
  contactId?: string | null
  dealId?: string | null
  assignedTo?: string | null
  startTime?: string
  endTime?: string
  location?: string | null
  status?: ScheduleStatus
}

export function useSchedules(
  organizationId?: string,
  filters?: ScheduleFilters
): UseSchedulesReturn {
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (effectiveOrgId) {
      params.append('organizationId', effectiveOrgId)
    }
    if (filters?.contactId) {
      params.append('contactId', filters.contactId)
    }
    if (filters?.type) {
      params.append('type', filters.type)
    }
    if (filters?.status) {
      params.append('status', filters.status)
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate)
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate)
    }
    return params.toString()
  }, [effectiveOrgId, filters])

  const fetchSchedules = useCallback(async () => {
    if (!effectiveOrgId) return

    setIsLoading(true)
    setError(null)
    try {
      const queryString = buildQueryString()
      const response = await fetch(`/api/schedules?${queryString}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar agendamentos')
      }

      setSchedules(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOrgId, filters?.type, filters?.status, filters?.startDate, filters?.endDate])

  const createSchedule = async (scheduleData: CreateScheduleData): Promise<Schedule | null> => {
    if (!effectiveOrgId) return null

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scheduleData, organizationId: effectiveOrgId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar agendamento')
      }

      await fetchSchedules()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento')
      return null
    }
  }

  const updateSchedule = async (id: string, scheduleData: UpdateScheduleData): Promise<Schedule | null> => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar agendamento')
      }

      await fetchSchedules()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar agendamento')
      return null
    }
  }

  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir agendamento')
      }

      await fetchSchedules()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir agendamento')
      return false
    }
  }

  const completeSchedule = async (id: string): Promise<Schedule | null> => {
    try {
      const response = await fetch(`/api/schedules/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao concluir agendamento')
      }

      await fetchSchedules()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir agendamento')
      return null
    }
  }

  // Create a stable filter key based on filter values (not object reference)
  const filterKey = `${effectiveOrgId || ''}:${filters?.type || ''}:${filters?.status || ''}:${filters?.startDate || ''}:${filters?.endDate || ''}`
  
  // Track the last fetched key to prevent duplicate fetches
  const lastFetchedKey = useRef<string | null>(null)
  
  useEffect(() => {
    if (effectiveOrgId && filterKey !== lastFetchedKey.current) {
      fetchSchedules()
      lastFetchedKey.current = filterKey
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, effectiveOrgId])

  return {
    schedules,
    isLoading,
    error,
    refreshSchedules: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
  }
}
