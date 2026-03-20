"use client"

import { useState, useEffect, useCallback } from 'react'

export interface WhatsAppInstance {
  id: string
  name: string
  phoneNumber: string
  displayPhoneNumber?: string
  verifiedName?: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  qualityRating?: string
  messagingLimit?: string
  connectedAt?: string
  createdAt: string
  _count?: {
    conversations: number
    templates: number
  }
}

export function useWhatsAppInstances(organizationId?: string | null) {
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

  // Filtra apenas instâncias conectadas
  const connectedInstances = instances.filter(
    (i) => i.status === 'CONNECTED'
  )

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  return {
    instances,
    connectedInstances,
    isLoading,
    error,
    refresh: fetchInstances,
  }
}
