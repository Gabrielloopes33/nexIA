"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import type { Integration, IntegrationSettings } from '@/lib/types/integration'

type ApiIntegration = {
  id: string
  type: string
  name: string
  status: string
  description?: string
  messagesCount?: number
  connectedAt?: string | Date | null
  lastSyncAt?: string | Date | null
  settings?: Record<string, unknown> | null
  createdAt: string | Date
  updatedAt: string | Date
}

const INTEGRATION_UI_META: Record<string, {
  color: string
  description: string
  category: Integration['category']
  authMethod: Integration['authMethod']
  features: string[]
  popular?: boolean
}> = {
  whatsapp: {
    color: '#25D366',
    description: 'Conecte sua conta oficial do WhatsApp Business para atendimento e automações.',
    category: 'communication',
    authMethod: 'oauth',
    features: ['Mensagens em tempo real', 'Templates', 'Histórico unificado'],
    popular: true,
  },
  instagram: {
    color: '#E4405F',
    description: 'Integre Instagram para centralizar DMs e interações comerciais.',
    category: 'communication',
    authMethod: 'oauth',
    features: ['DM unificada', 'Sincronização de contato', 'Atendimento multicanal'],
  },
  linkedin: {
    color: '#0A66C2',
    description: 'Capture e sincronize leads de formulários do LinkedIn Ads.',
    category: 'crm',
    authMethod: 'oauth',
    features: ['Lead Gen Forms', 'Mapeamento de campos', 'Importação automática'],
  },
  calendly: {
    color: '#006BFF',
    description: 'Sincronize agendamentos do Calendly com contatos e atividades.',
    category: 'automation',
    authMethod: 'api_key',
    features: ['Sincronização de agendas', 'Criação de atividades', 'Atualização de contatos'],
  },
  typebot: {
    color: '#111827',
    description: 'Receba respostas de fluxos Typebot e converta em contatos automaticamente.',
    category: 'automation',
    authMethod: 'webhook',
    features: ['Webhook seguro', 'Mapeamento de campos', 'Tag e lista automáticas'],
  },
}

function parseDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function normalizeStatus(rawStatus: string): Integration['status'] {
  const status = rawStatus.toLowerCase()

  if (status === 'connected' || status === 'active') return 'connected'
  if (status === 'connecting') return 'connecting'
  if (status === 'syncing') return 'syncing'
  if (status === 'error' || status === 'failed') return 'error'
  if (status === 'warning') return 'warning'
  if (status === 'paused') return 'paused'

  if (status === 'disconnected' || status === 'not_connected' || status === 'pending' || status === 'pending_setup') {
    return 'not_connected'
  }

  return 'not_connected'
}

function mapApiIntegrationToUi(item: ApiIntegration): Integration {
  const slug = item.type.toLowerCase()
  const meta = INTEGRATION_UI_META[slug] ?? {
    color: '#46347F',
    description: 'Integração disponível para conectar ao CRM.',
    category: 'other' as const,
    authMethod: 'api_key' as const,
    features: ['Conexão de dados'],
  }

  return {
    id: item.id,
    name: item.name,
    slug,
    description: item.description ?? meta.description,
    logo: '',
    color: meta.color,
    category: meta.category,
    authMethod: meta.authMethod,
    status: normalizeStatus(item.status),
    features: meta.features,
    messagesCount: item.messagesCount,
    lastSyncAt: parseDate(item.lastSyncAt),
    settings: (item.settings ?? {}) as IntegrationSettings,
    popular: Boolean(meta.popular),
    connectedAt: parseDate(item.connectedAt),
    createdAt: parseDate(item.createdAt) ?? new Date(),
    updatedAt: parseDate(item.updatedAt) ?? new Date(),
  }
}

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
  const apiIntegrations = Array.isArray(data.data) ? (data.data as ApiIntegration[]) : []
  return apiIntegrations.map(mapApiIntegrationToUi)
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
