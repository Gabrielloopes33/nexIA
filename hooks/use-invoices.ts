"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export type InvoiceStatus = 'pending' | 'paid' | 'failed'

export interface InvoiceLineItem {
  description: string
  amountCents: number
  quantity: number
}

export interface Plan {
  id: string
  name: string
  description?: string
  priceCents: number
  interval: 'monthly' | 'yearly'
  status: string
}

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  plan: Plan
  status: 'active' | 'canceled' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string
}

export interface Charge {
  id: string
  organizationId: string
  invoiceId?: string
  amountCents: number
  description?: string
  status: 'pending' | 'paid' | 'failed'
  paymentMethod?: string
  paidAt?: string
  createdAt: string
}

export interface Invoice {
  id: string
  subscriptionId: string
  subscription: Subscription
  organizationId: string
  amountCents: number
  status: InvoiceStatus
  dueDate: string
  paidAt?: string
  invoiceUrl?: string
  stripeInvoiceId?: string
  charges: Charge[]
  createdAt: string
  updatedAt: string
}

interface UseInvoicesOptions {
  status?: InvoiceStatus
}

interface UseInvoicesReturn {
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createInvoice: (data: {
    subscriptionId: string
    amountCents: number
    dueDate: string
    status?: string
  }) => Promise<Invoice | null>
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice | null>
  markAsPaid: (id: string, paidAt?: string) => Promise<boolean>
}

export function useInvoices(
  organizationId?: string,
  options: UseInvoicesOptions = {}
): UseInvoicesReturn {
  const orgIdFromContext = useOrganizationId()
  const effectiveOrgId = organizationId ?? orgIdFromContext

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQueryString = () => {
    const params = new URLSearchParams()
    if (effectiveOrgId) params.append('organizationId', effectiveOrgId)
    if (options.status) params.append('status', options.status)
    return params.toString()
  }

  const fetchInvoices = useCallback(async () => {
    if (!effectiveOrgId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/invoices?${buildQueryString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar faturas')
      }

      setInvoices(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId, options.status])

  const createInvoice = async (invoiceData: {
    subscriptionId: string
    amountCents: number
    dueDate: string
    status?: string
  }): Promise<Invoice | null> => {
    if (!effectiveOrgId) return null

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceData,
          organizationId: effectiveOrgId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar fatura')
      }

      await fetchInvoices()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fatura')
      return null
    }
  }

  const updateInvoice = async (
    id: string,
    invoiceData: Partial<Invoice>
  ): Promise<Invoice | null> => {
    try {
      const response = await fetch(`/api/invoices/id?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar fatura')
      }

      await fetchInvoices()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar fatura')
      return null
    }
  }

  const markAsPaid = async (id: string, paidAt?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/invoices/id?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidAt: paidAt || new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao marcar fatura como paga')
      }

      await fetchInvoices()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar fatura como paga')
      return false
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    isLoading,
    error,
    refetch: fetchInvoices,
    createInvoice,
    updateInvoice,
    markAsPaid,
  }
}
