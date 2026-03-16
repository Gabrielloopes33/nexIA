"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import type { Integration, IntegrationSettings } from '@/lib/types/integration'

export interface UseIntegrationsReturn {
  integrations: Integration[]
  isLoading: boolean
  error: string | null
  refreshIntegrations: () => Promise<void>
  connectIntegration: (id: string, settings?: Partial<IntegrationSettings>) => Promise<Integration | null>
  disconnectIntegration: (id: string) => Promise<boolean>
  updateIntegrationSettings: (id: string, settings: Partial<IntegrationSettings>) => Promise<Integration | null>
  configureIntegration: (id: string, config: Record<string, unknown>) => Promise<Integration | null>
}

// Busca integrações da API
async function fetchIntegrationsFromAPI(organizationId: string): Promise<Integration[]> {
  const response = await fetch(`/api/integrations?organizationId=${organizationId}`)
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao carregar integrações')
  return data.data
}

export function useIntegrations(): UseIntegrationsReturn {
  const organizationId = useOrganizationId()
  
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIntegrations = useCallback(async () => {
    if (!organizationId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchIntegrationsFromAPI(organizationId)
      setIntegrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar integrações')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const connectIntegration = useCallback(async (
    id: string, 
    settings?: Partial<IntegrationSettings>
  ): Promise<Integration | null> => {
    if (!organizationId) return null
    
    try {
      const response = await fetch(`/api/integrations/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, settings }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao conectar integração')
      
      // Atualiza estado local
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              status: 'connecting' as const,
              settings: { ...int.settings, ...settings } as IntegrationSettings
            }
          : int
      ))
      
      // Simula delay de conexão
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              status: 'connected' as const,
              connectedAt: new Date(),
              updatedAt: new Date()
            }
          : int
      ))
      
      const updated = integrations.find(i => i.id === id)
      return updated || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar integração')
      return null
    }
  }, [organizationId, integrations])

  const disconnectIntegration = useCallback(async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      // Sprint 5: Substituir por chamada real à API
      // const response = await fetch(`/api/integrations/${id}/disconnect`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ organizationId }),
      // })
      // const data = await response.json()
      // if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao desconectar integração')
      
      // Simulação local
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              status: 'not_connected' as const,
              connectedAt: undefined,
              updatedAt: new Date()
            }
          : int
      ))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar integração')
      return false
    }
  }, [organizationId])

  const updateIntegrationSettings = useCallback(async (
    id: string, 
    settings: Partial<IntegrationSettings>
  ): Promise<Integration | null> => {
    if (!organizationId) return null
    
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, settings }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao atualizar configurações')
      
      // Atualiza estado local
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              settings: { ...int.settings, ...settings } as IntegrationSettings,
              updatedAt: new Date()
            }
          : int
      ))
      
      const updated = integrations.find(i => i.id === id)
      return updated || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configurações')
      return null
    }
  }, [organizationId, integrations])

  const configureIntegration = useCallback(async (
    id: string,
    config: Record<string, unknown>
  ): Promise<Integration | null> => {
    if (!organizationId) return null
    
    try {
      // Sprint 5: Substituir por chamada real à API
      // const response = await fetch(`/api/integrations/${id}/configure`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ organizationId, config }),
      // })
      // const data = await response.json()
      // if (!response.ok || !data.success) throw new Error(data.error || 'Erro ao configurar integração')
      
      // Simulação local
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              updatedAt: new Date()
            }
          : int
      ))
      
      const updated = integrations.find(i => i.id === id)
      return updated || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar integração')
      return null
    }
  }, [organizationId, integrations])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  return {
    integrations,
    isLoading,
    error,
    refreshIntegrations: fetchIntegrations,
    connectIntegration,
    disconnectIntegration,
    updateIntegrationSettings,
    configureIntegration,
  }
}
