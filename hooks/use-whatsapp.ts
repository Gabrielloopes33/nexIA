"use client"

import { useState, useEffect, useCallback } from 'react'
import type { WhatsAppBusinessAccount, ComplianceInfo } from '@/lib/whatsapp/types'
import {
  connectWhatsAppAccount,
  disconnectWhatsAppAccount,
  refreshAccountConnection,
  getAccountStatus,
  getComplianceInfo,
} from '@/lib/whatsapp/api'

interface UseWhatsAppReturn {
  account: WhatsAppBusinessAccount | null
  status: WhatsAppBusinessAccount['status'] | 'loading' | 'error'
  compliance: ComplianceInfo | null
  isLoading: boolean
  error: string | null
  connect: (accessToken: string, wabaId: string) => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

export function useWhatsApp(): UseWhatsAppReturn {
  const [account, setAccount] = useState<WhatsAppBusinessAccount | null>(null)
  const [status, setStatus] = useState<WhatsAppBusinessAccount['status'] | 'loading' | 'error'>('not_connected')
  const [compliance, setCompliance] = useState<ComplianceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load account from local storage on mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('whatsapp_account')
    if (savedAccount) {
      try {
        const parsed = JSON.parse(savedAccount)
        setAccount(parsed)
        setStatus(parsed.status)
      } catch {
        localStorage.removeItem('whatsapp_account')
      }
    }
  }, [])

  const connect = useCallback(async (accessToken: string, wabaId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await connectWhatsAppAccount({ accessToken, wabaId })
      if (response.success && response.account) {
        setAccount(response.account)
        setStatus(response.account.status)
        localStorage.setItem('whatsapp_account', JSON.stringify(response.account))
        
        // Load compliance info
        const complianceData = await getComplianceInfo(response.account.wabaId)
        setCompliance(complianceData)
      } else {
        setError(response.error || 'Falha ao conectar conta WhatsApp')
        setStatus('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (!account) return
    
    setIsLoading(true)
    try {
      await disconnectWhatsAppAccount(account.id)
      setAccount(null)
      setStatus('not_connected')
      setCompliance(null)
      localStorage.removeItem('whatsapp_account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar')
    } finally {
      setIsLoading(false)
    }
  }, [account])

  const refresh = useCallback(async () => {
    if (!account) return
    
    setIsLoading(true)
    try {
      const refreshedAccount = await refreshAccountConnection(account.id)
      setAccount(refreshedAccount)
      setStatus(refreshedAccount.status)
      localStorage.setItem('whatsapp_account', JSON.stringify(refreshedAccount))
      
      // Refresh compliance info
      const complianceData = await getComplianceInfo(account.wabaId)
      setCompliance(complianceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setIsLoading(false)
    }
  }, [account])

  return {
    account,
    status,
    compliance,
    isLoading,
    error,
    connect,
    disconnect,
    refresh,
  }
}
