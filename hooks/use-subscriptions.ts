"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due'
export type SubscriptionInterval = 'monthly' | 'yearly'

export interface Plan {
  id: string
  name: string
  description?: string
  priceCents: number
  interval: SubscriptionInterval
  features?: unknown
  limits?: unknown
  status: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  subscriptionId: string
  organizationId: string
  amountCents: number
  status: 'pending' | 'paid' | 'failed'
  dueDate: string
  paidAt?: string
  invoiceUrl?: string
  stripeInvoiceId?: string
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  plan: Plan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  canceledAt?: string
  invoices: Invoice[]
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionData {
  planId: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

interface UseSubscriptionsOptions {
  status?: SubscriptionStatus
}

interface UseSubscriptionsReturn {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createSubscription: (data: CreateSubscriptionData) => Promise<Subscription | null>
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<Subscription | null>
  cancelSubscription: (id: string) => Promise<boolean>
}

export function useSubscriptions(
  organizationId?: string,
  options: UseSubscriptionsOptions = {}
): UseSubscriptionsReturn {
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQueryString = () => {
    const params = new URLSearchParams()
    if (effectiveOrgId) params.append('organizationId', effectiveOrgId)
    if (options.status) params.append('status', options.status)
    return params.toString()
  }

  const fetchSubscriptions = useCallback(async () => {
    if (!effectiveOrgId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subscriptions?${buildQueryString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar assinaturas')
      }

      setSubscriptions(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinaturas')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId, options.status])

  const createSubscription = async (subscriptionData: {
    planId: string
    currentPeriodStart: string
    currentPeriodEnd: string
  }): Promise<Subscription | null> => {
    if (!effectiveOrgId) return null

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscriptionData,
          organizationId: effectiveOrgId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      await fetchSubscriptions()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar assinatura')
      return null
    }
  }

  const updateSubscription = async (
    id: string,
    subscriptionData: Partial<Subscription>
  ): Promise<Subscription | null> => {
    try {
      const response = await fetch(`/api/subscriptions/id?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar assinatura')
      }

      await fetchSubscriptions()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar assinatura')
      return null
    }
  }

  const cancelSubscription = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/subscriptions/id?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'canceled',
          canceledAt: new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao cancelar assinatura')
      }

      await fetchSubscriptions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura')
      return false
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
  }
}
