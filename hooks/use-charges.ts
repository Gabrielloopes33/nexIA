"use client"

import { useState, useEffect, useCallback } from "react"
import { useOrganizationId } from "@/lib/contexts/organization-context"

export type ChargeStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "disputed"

export type ChargeSource = "manual" | "subscription" | "invoice" | "api"

export interface Charge {
  id: string
  organizationId: string
  customerId?: string | null
  invoiceId?: string | null
  subscriptionId?: string | null
  stripePaymentIntentId?: string | null
  stripeChargeId?: string | null
  amount: number
  currency: string
  status: ChargeStatus
  source: ChargeSource
  description?: string | null
  failureCode?: string | null
  failureMessage?: string | null
  refundedAmount: number
  receiptUrl?: string | null
  paymentMethodType?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateChargeData {
  amount: number
  currency?: string
  description?: string
  customerId?: string
  paymentMethodId?: string
  metadata?: Record<string, unknown>
}

export interface RefundChargeData {
  amount?: number
  reason?: string
}

export interface UseChargesOptions {
  status?: ChargeStatus
  source?: ChargeSource
  limit?: number
  offset?: number
}

export interface UseChargesReturn {
  charges: Charge[]
  total: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCharge: (data: CreateChargeData) => Promise<Charge | null>
  refundCharge: (id: string, data?: RefundChargeData) => Promise<boolean>
  retryCharge: (id: string) => Promise<Charge | null>
}

// Busca cobranças da API
async function fetchChargesFromAPI(
  organizationId: string,
  options?: UseChargesOptions
): Promise<{ charges: Charge[]; total: number }> {
  const params = new URLSearchParams()
  params.append("organizationId", organizationId)
  if (options?.status) params.append("status", options.status)
  if (options?.source) params.append("source", options.source)
  if (options?.limit) params.append("limit", options.limit.toString())
  if (options?.offset) params.append("offset", options.offset.toString())

  const response = await fetch(`/api/charges?${params.toString()}`)
  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Erro ao carregar cobranças")
  }
  return {
    charges: data.data,
    total: data.pagination?.total || 0,
  }
}

export function useCharges(options?: UseChargesOptions): UseChargesReturn {
  const organizationId = useOrganizationId()

  const [charges, setCharges] = useState<Charge[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCharges = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchChargesFromAPI(organizationId, options)
      setCharges(data.charges)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar cobranças")
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, options?.status, options?.source, options?.limit, options?.offset])

  const createCharge = useCallback(
    async (chargeData: CreateChargeData): Promise<Charge | null> => {
      if (!organizationId) return null

      try {
        const response = await fetch("/api/charges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...chargeData,
            organizationId,
            currency: chargeData.currency || "brl",
          }),
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erro ao criar cobrança")
        }

        // Atualiza estado local
        setCharges((prev) => [data.data, ...prev])
        setTotal((prev) => prev + 1)
        return data.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar cobrança")
        return null
      }
    },
    [organizationId]
  )

  const refundCharge = useCallback(
    async (id: string, refundData?: RefundChargeData): Promise<boolean> => {
      if (!organizationId) return false

      try {
        const response = await fetch(`/api/charges/${id}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            ...refundData,
          }),
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erro ao estornar cobrança")
        }

        // Atualiza estado local
        setCharges((prev) =>
          prev.map((charge) =>
            charge.id === id
              ? {
                  ...charge,
                  status: data.data.status,
                  refundedAmount: data.data.refundedAmount,
                  updatedAt: new Date().toISOString(),
                }
              : charge
          )
        )
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao estornar cobrança")
        return false
      }
    },
    [organizationId]
  )

  const retryCharge = useCallback(
    async (id: string): Promise<Charge | null> => {
      if (!organizationId) return null

      try {
        const response = await fetch(`/api/charges/${id}/retry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erro ao tentar cobrança novamente")
        }

        // Atualiza estado local
        setCharges((prev) =>
          prev.map((charge) =>
            charge.id === id
              ? {
                  ...charge,
                  status: data.data.status,
                  failureCode: null,
                  failureMessage: null,
                  updatedAt: new Date().toISOString(),
                }
              : charge
          )
        )
        return data.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao tentar cobrança novamente")
        return null
      }
    },
    [organizationId]
  )

  useEffect(() => {
    fetchCharges()
  }, [fetchCharges])

  return {
    charges,
    total,
    isLoading,
    error,
    refetch: fetchCharges,
    createCharge,
    refundCharge,
    retryCharge,
  }
}
