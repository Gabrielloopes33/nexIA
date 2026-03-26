"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface ContactDeal {
  id: string
  title: string
  description?: string
  value: number
  currency: string
  status: 'OPEN' | 'WON' | 'LOST' | 'PAUSED' | 'CANCELLED'
  priority: string
  expectedCloseDate?: string
  actualCloseDate?: string
  leadScore: number
  stage: {
    id: string
    name: string
    color: string
    probability: number
  }
  assignedUser?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface UseContactDealsReturn {
  deals: ContactDeal[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useContactDeals(
  contactId: string | undefined
): UseContactDealsReturn {
  const organizationId = useOrganizationId()
  const [deals, setDeals] = useState<ContactDeal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    if (!contactId || !organizationId) {
      setDeals([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/contacts/${contactId}/deals?organizationId=${organizationId}`
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar negócios')
      }

      // Transformar os deals para o formato esperado
      const formattedDeals: ContactDeal[] = (data.data || []).map((deal: Record<string, unknown>) => ({
        id: deal.id as string,
        title: deal.title as string,
        description: deal.description as string | undefined,
        value: deal.value ? Number(deal.value) : 0,
        currency: (deal.currency as string) || 'BRL',
        status: deal.status as ContactDeal['status'],
        priority: deal.priority as string,
        expectedCloseDate: deal.expectedCloseDate 
          ? new Date(deal.expectedCloseDate as string).toISOString() 
          : undefined,
        actualCloseDate: deal.actualCloseDate 
          ? new Date(deal.actualCloseDate as string).toISOString() 
          : undefined,
        leadScore: deal.leadScore as number,
        stage: {
          id: (deal.stage as Record<string, string>)?.id || '',
          name: (deal.stage as Record<string, string>)?.name || 'N/A',
          color: (deal.stage as Record<string, string>)?.color || '#6B7280',
          probability: (deal.stage as Record<string, number>)?.probability || 0,
        },
        assignedUser: deal.assignedUser as ContactDeal['assignedUser'],
        createdAt: new Date(deal.createdAt as string).toISOString(),
        updatedAt: new Date(deal.updatedAt as string).toISOString(),
      }))

      setDeals(formattedDeals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar negócios')
      setDeals([])
    } finally {
      setIsLoading(false)
    }
  }, [contactId, organizationId])

  useEffect(() => {
    if (contactId && organizationId) {
      fetchDeals()
    }
  }, [contactId, organizationId, fetchDeals])

  return {
    deals,
    isLoading,
    error,
    refresh: fetchDeals,
  }
}
