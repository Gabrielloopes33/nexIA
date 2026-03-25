"use client"

import { useState, useEffect, useCallback } from 'react'

export type InstanceType = 'OFFICIAL' | 'EVOLUTION'

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
  type: InstanceType
  profileName?: string
  profilePictureUrl?: string
  _count?: {
    conversations: number
    templates: number
  }
}

interface EvolutionInstanceResponse {
  id: string
  name: string
  instanceName: string
  status: string
  phoneNumber: string | null
  profileName: string | null
  profilePictureUrl: string | null
  connectedAt: string | null
  lastActivityAt: string | null
  createdAt: string
  updatedAt: string
}

interface OfficialInstanceResponse {
  id: string
  name: string
  phoneNumber: string
  displayPhoneNumber?: string
  verifiedName?: string
  status: string
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
      // Buscar ambos os tipos de instâncias em paralelo
      const [officialResponse, evolutionResponse] = await Promise.allSettled([
        fetch(`/api/whatsapp/instances?organizationId=${organizationId}`),
        fetch(`/api/evolution/instances/connected?organizationId=${organizationId}`)
      ])

      const combinedInstances: WhatsAppInstance[] = []

      // Processar instâncias oficiais
      if (officialResponse.status === 'fulfilled' && officialResponse.value.ok) {
        const officialData = await officialResponse.value.json()
        if (officialData.success && officialData.data) {
          const officialInstances: WhatsAppInstance[] = officialData.data.map(
            (instance: OfficialInstanceResponse) => ({
              id: instance.id,
              name: instance.name || instance.verifiedName || 'WhatsApp Oficial',
              phoneNumber: instance.phoneNumber,
              displayPhoneNumber: instance.displayPhoneNumber || instance.phoneNumber,
              verifiedName: instance.verifiedName,
              status: mapStatus(instance.status),
              qualityRating: instance.qualityRating,
              messagingLimit: instance.messagingLimit,
              connectedAt: instance.connectedAt,
              createdAt: instance.createdAt,
              type: 'OFFICIAL' as InstanceType,
              _count: instance._count
            })
          )
          combinedInstances.push(...officialInstances)
        }
      }

      // Processar instâncias Evolution
      if (evolutionResponse.status === 'fulfilled' && evolutionResponse.value.ok) {
        const evolutionData = await evolutionResponse.value.json()
        if (evolutionData.success && evolutionData.data) {
          const evolutionInstances: WhatsAppInstance[] = evolutionData.data.map(
            (instance: EvolutionInstanceResponse) => ({
              id: instance.id,
              name: instance.name || instance.profileName || 'WhatsApp Evolution',
              phoneNumber: instance.phoneNumber || '',
              displayPhoneNumber: instance.phoneNumber || instance.profileName || instance.instanceName,
              verifiedName: instance.profileName || undefined,
              status: mapStatus(instance.status),
              connectedAt: instance.connectedAt || undefined,
              createdAt: instance.createdAt,
              type: 'EVOLUTION' as InstanceType,
              profileName: instance.profileName || undefined,
              profilePictureUrl: instance.profilePictureUrl || undefined
            })
          )
          combinedInstances.push(...evolutionInstances)
        }
      }

      setInstances(combinedInstances)
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

// Função auxiliar para mapear status para valores padrão
function mapStatus(status: string): 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR' {
  const normalizedStatus = status?.toUpperCase()
  
  if (normalizedStatus === 'CONNECTED' || normalizedStatus === 'OPEN') {
    return 'CONNECTED'
  }
  if (normalizedStatus === 'CONNECTING') {
    return 'CONNECTING'
  }
  if (normalizedStatus === 'DISCONNECTED' || normalizedStatus === 'CLOSED' || normalizedStatus === 'CLOSE') {
    return 'DISCONNECTED'
  }
  return 'ERROR'
}
