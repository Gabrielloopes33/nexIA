"use client"

import { useState, useEffect, useCallback } from 'react'

export interface WhatsAppInstance {
  id: string
  name: string
  phoneNumber: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'SUSPENDED' | 'PENDING_SETUP'
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
  messagingLimit: number
  connectedAt?: string | null
  createdAt: string
  _count?: {
    conversations: number
    templates: number
  }
}

interface UseWhatsAppInstancesReturn {
  instances: WhatsAppInstance[]
  isLoading: boolean
  error: string | null
  refreshInstances: () => Promise<void>
}

export function useWhatsAppInstances(organizationId?: string): UseWhatsAppInstancesReturn {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstances = useCallback(async () => {
    if (!organizationId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/whatsapp/instances?organizationId=${organizationId}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar instâncias')
      }
      
      setInstances(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar instâncias')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  return {
    instances,
    isLoading,
    error,
    refreshInstances: fetchInstances,
  }
}
