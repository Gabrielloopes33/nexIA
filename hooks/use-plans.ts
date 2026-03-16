"use client"

import { useState, useEffect, useCallback } from 'react'

export type BillingInterval = 'monthly' | 'yearly'
export type PlanStatus = 'active' | 'inactive'

export interface Plan {
  id: string
  name: string
  description?: string
  priceCents: number
  interval: BillingInterval
  features?: unknown
  limits?: unknown
  status: PlanStatus
  createdAt: string
  updatedAt: string
}

interface UsePlansOptions {
  status?: 'active' | 'inactive' | 'all'
}

interface UsePlansReturn {
  plans: Plan[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createPlan: (data: {
    name: string
    description?: string
    priceCents: number
    interval: 'monthly' | 'yearly'
    features?: unknown
    limits?: unknown
  }) => Promise<Plan | null>
  updatePlan: (id: string, data: Partial<Plan>) => Promise<Plan | null>
  deletePlan: (id: string) => Promise<boolean>
}

export function usePlans(options: UsePlansOptions = {}): UsePlansReturn {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildQueryString = () => {
    const params = new URLSearchParams()
    if (options.status) params.append('status', options.status)
    return params.toString()
  }

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/plans?${buildQueryString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar planos')
      }

      setPlans(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planos')
    } finally {
      setIsLoading(false)
    }
  }, [options.status])

  const createPlan = async (planData: {
    name: string
    description?: string
    priceCents: number
    interval: 'monthly' | 'yearly'
    features?: unknown
    limits?: unknown
  }): Promise<Plan | null> => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar plano')
      }

      await fetchPlans()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar plano')
      return null
    }
  }

  const updatePlan = async (id: string, planData: Partial<Plan>): Promise<Plan | null> => {
    try {
      const response = await fetch(`/api/plans/id?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar plano')
      }

      await fetchPlans()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar plano')
      return null
    }
  }

  const deletePlan = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/plans/id?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir plano')
      }

      await fetchPlans()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir plano')
      return false
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  }
}
