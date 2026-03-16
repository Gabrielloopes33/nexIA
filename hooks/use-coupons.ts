"use client"

import { useState, useCallback } from "react"

export type CouponDiscountType = "percentage" | "fixed_amount"

export interface ValidatedCoupon {
  id: string
  code: string
  name: string
  description?: string | null
  discountType: CouponDiscountType
  discountValue: number
  currency?: string | null
  maxDiscountAmount?: number | null
  minPurchaseAmount?: number | null
  validFrom: string
  validUntil?: string | null
  maxUses?: number | null
  currentUses: number
  appliesToPlans: string[]
  isValid: boolean
  errorMessage?: string | null
  calculatedDiscount?: number
}

export interface ValidateCouponOptions {
  planId?: string
  amount?: number
  currency?: string
}

export interface UseCouponsReturn {
  isValidating: boolean
  error: string | null
  lastValidatedCoupon: ValidatedCoupon | null
  validateCoupon: (code: string, options?: ValidateCouponOptions) => Promise<ValidatedCoupon | null>
  clearCoupon: () => void
}

// Valida cupom na API
async function validateCouponWithAPI(
  code: string,
  options?: ValidateCouponOptions
): Promise<ValidatedCoupon> {
  const params = new URLSearchParams()
  params.append("code", code)
  if (options?.planId) params.append("planId", options.planId)
  if (options?.amount) params.append("amount", options.amount.toString())
  if (options?.currency) params.append("currency", options.currency)

  const response = await fetch(`/api/coupons/validate?${params.toString()}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "Erro ao validar cupom")
  }
  return data.data
}

export function useCoupons(): UseCouponsReturn {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastValidatedCoupon, setLastValidatedCoupon] = useState<ValidatedCoupon | null>(null)

  const validateCoupon = useCallback(
    async (code: string, options?: ValidateCouponOptions): Promise<ValidatedCoupon | null> => {
      if (!code.trim()) {
        setError("Código do cupom é obrigatório")
        return null
      }

      setIsValidating(true)
      setError(null)

      try {
        const coupon = await validateCouponWithAPI(code.trim().toUpperCase(), options)
        setLastValidatedCoupon(coupon)
        return coupon
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao validar cupom"
        setError(errorMessage)

        // Cria um cupom inválido para retornar
        const invalidCoupon: ValidatedCoupon = {
          id: "",
          code: code.trim().toUpperCase(),
          name: "",
          discountType: "percentage",
          discountValue: 0,
          validFrom: new Date().toISOString(),
          currentUses: 0,
          appliesToPlans: [],
          isValid: false,
          errorMessage: errorMessage,
        }
        setLastValidatedCoupon(invalidCoupon)
        return invalidCoupon
      } finally {
        setIsValidating(false)
      }
    },
    []
  )

  const clearCoupon = useCallback(() => {
    setLastValidatedCoupon(null)
    setError(null)
  }, [])

  return {
    isValidating,
    error,
    lastValidatedCoupon,
    validateCoupon,
    clearCoupon,
  }
}
