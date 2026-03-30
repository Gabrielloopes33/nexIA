"use client"

import { useState, useEffect, useCallback } from 'react'
import type { WhatsAppPhoneNumber, AddPhoneNumberRequest } from '@/lib/whatsapp/types'
import {
  getPhoneNumbers,
  addPhoneNumber,
  removePhoneNumber,
  requestVerificationCode,
  verifyPhoneNumber,
  setDefaultPhoneNumber,
} from '@/lib/whatsapp/api'

interface UseWhatsAppPhoneNumbersReturn {
  phoneNumbers: WhatsAppPhoneNumber[]
  isLoading: boolean
  error: string | null
  addNumber: (request: AddPhoneNumberRequest) => Promise<void>
  removeNumber: (phoneNumberId: string) => Promise<void>
  requestCode: (phoneNumberId: string) => Promise<void>
  verifyNumber: (phoneNumberId: string, code: string) => Promise<void>
  setAsDefault: (phoneNumberId: string) => Promise<void>
  refreshNumbers: () => Promise<void>
}

export function useWhatsAppPhoneNumbers(wabaId?: string): UseWhatsAppPhoneNumbersReturn {
  const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppPhoneNumber[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhoneNumbers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPhoneNumbers(wabaId)
      setPhoneNumbers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar números')
    } finally {
      setIsLoading(false)
    }
  }, [wabaId])

  useEffect(() => {
    fetchPhoneNumbers()
  }, [fetchPhoneNumbers])

  const addNumber = useCallback(async (request: AddPhoneNumberRequest) => {
    setIsLoading(true)
    try {
      const newNumber = await addPhoneNumber(wabaId || 'default', request)
      setPhoneNumbers((prev) => [...prev, newNumber])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar número')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [wabaId])

  const removeNumber = useCallback(async (phoneNumberId: string) => {
    setIsLoading(true)
    try {
      await removePhoneNumber(phoneNumberId)
      setPhoneNumbers((prev) => prev.filter((p) => p.id !== phoneNumberId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover número')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestCode = useCallback(async (phoneNumberId: string) => {
    setIsLoading(true)
    try {
      await requestVerificationCode(phoneNumberId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar código')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyNumber = useCallback(async (phoneNumberId: string, code: string) => {
    setIsLoading(true)
    try {
      await verifyPhoneNumber(phoneNumberId, code)
      // Refresh phone numbers to get updated status
      await fetchPhoneNumbers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar número')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchPhoneNumbers])

  const setAsDefault = useCallback(async (phoneNumberId: string) => {
    setIsLoading(true)
    try {
      await setDefaultPhoneNumber(wabaId || 'default', phoneNumberId)
      // Update local state
      setPhoneNumbers((prev) =>
        prev.map((p) => ({
          ...p,
          isDefault: p.id === phoneNumberId,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir padrão')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [wabaId])

  const refreshNumbers = useCallback(async () => {
    await fetchPhoneNumbers()
  }, [fetchPhoneNumbers])

  return {
    phoneNumbers,
    isLoading,
    error,
    addNumber,
    removeNumber,
    requestCode,
    verifyNumber,
    setAsDefault,
    refreshNumbers,
  }
}
