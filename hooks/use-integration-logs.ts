"use client"

import useSWR, { mutate as globalMutate } from 'swr'
import { useCallback } from 'react'

// Types
export type IntegrationType = 'WHATSAPP' | 'INSTAGRAM' | 'CALENDLY' | 'TYPEBOT' | 'LINKEDIN' | 'N8N' | 'MAKE' | 'ZAPIER' | 'WEBHOOK' | 'API'
export type IntegrationActivityType = 
  | 'AUTH_CONNECTED' 
  | 'AUTH_DISCONNECTED' 
  | 'AUTH_REFRESHED' 
  | 'AUTH_FAILED' 
  | 'WEBHOOK_RECEIVED' 
  | 'WEBHOOK_SENT' 
  | 'MESSAGE_SENT' 
  | 'MESSAGE_RECEIVED' 
  | 'SYNC_STARTED' 
  | 'SYNC_COMPLETED' 
  | 'SYNC_FAILED' 
  | 'TEMPLATE_SENT' 
  | 'ERROR' 
  | 'CONFIG_UPDATED'
export type IntegrationActivityStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'WARNING'

export interface IntegrationActivityLog {
  id: string
  integrationType: IntegrationType
  instanceId?: string
  activityType: IntegrationActivityType
  status: IntegrationActivityStatus
  title: string
  description?: string
  requestPayload?: any
  responsePayload?: any
  errorMessage?: string
  errorCode?: string
  contactId?: string
  dealId?: string
  messageId?: string
  durationMs?: number
  retryCount: number
  maxRetries: number
  createdAt: string
  completedAt?: string
}

export interface IntegrationStats {
  period: string
  totalCount: number
  byIntegrationType: Record<string, number>
  byActivityType: Record<string, number>
  byStatus: Record<string, number>
  successRate: number
  avgDurationMs: number
  recentErrors: Array<{
    id: string
    integrationType: IntegrationType
    activityType: IntegrationActivityType
    title: string
    errorMessage?: string
    createdAt: string
  }>
}

export interface LogsPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface LogsResponse {
  success: boolean
  data: IntegrationActivityLog[]
  meta: LogsPagination
}

export interface LogStatsResponse {
  success: boolean
  data: IntegrationStats
}

export interface CreateLogRequest {
  integrationType: IntegrationType
  instanceId?: string
  activityType: IntegrationActivityType
  status?: IntegrationActivityStatus
  title: string
  description?: string
  requestPayload?: any
  responsePayload?: any
  errorMessage?: string
  errorCode?: string
  contactId?: string
  dealId?: string
  messageId?: string
  durationMs?: number
  retryCount?: number
  maxRetries?: number
}

export interface UseIntegrationLogsFilters {
  type?: IntegrationType
  status?: IntegrationActivityStatus
  activityType?: IntegrationActivityType
  instanceId?: string
  contactId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch data')
  }
  
  return data
}

// Hook para pegar organizationId do localStorage
function useOrganizationId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const saved = localStorage.getItem('current_organization_id')
  return saved || undefined
}

// Build query string from filters
function buildLogsQueryString(filters: UseIntegrationLogsFilters = {}): string {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.status) params.append('status', filters.status)
  if (filters.activityType) params.append('activityType', filters.activityType)
  if (filters.instanceId) params.append('instanceId', filters.instanceId)
  if (filters.contactId) params.append('contactId', filters.contactId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.offset) params.append('offset', filters.offset.toString())
  
  return params.toString()
}

export interface UseIntegrationLogsReturn {
  logs: IntegrationActivityLog[]
  pagination: LogsPagination | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
  createLog: (data: CreateLogRequest) => Promise<IntegrationActivityLog>
  clearLogs: (days?: number) => Promise<{ deletedCount: number }>
  getStats: (period?: string) => Promise<IntegrationStats>
}

export function useIntegrationLogs(
  filters: UseIntegrationLogsFilters = {}
): UseIntegrationLogsReturn {
  const organizationId = useOrganizationId()
  
  const queryString = buildLogsQueryString(filters)
  const cacheKey = organizationId 
    ? `/api/integrations/logs?${queryString}` 
    : null
  
  const { data, error, isLoading, mutate: swrMutate } = useSWR<LogsResponse>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
    }
  )

  const mutate = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  const createLog = useCallback(async (logData: CreateLogRequest): Promise<IntegrationActivityLog> => {
    const response = await fetch('/api/integrations/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create log')
    }

    // Revalidate the logs list
    if (cacheKey) {
      await swrMutate()
    }

    return result.data
  }, [cacheKey, swrMutate])

  const clearLogs = useCallback(async (days: number = 30): Promise<{ deletedCount: number }> => {
    const response = await fetch(`/api/integrations/logs?days=${days}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to clear logs')
    }

    // Revalidate the logs list
    if (cacheKey) {
      await swrMutate()
    }

    return { deletedCount: result.deletedCount }
  }, [cacheKey, swrMutate])

  const getStats = useCallback(async (period: string = '24h'): Promise<IntegrationStats> => {
    const response = await fetch(`/api/integrations/logs/stats?period=${period}`)
    const result: LogStatsResponse = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch stats')
    }

    return result.data
  }, [])

  return {
    logs: data?.data || [],
    pagination: data?.meta || null,
    isLoading,
    error: error || null,
    mutate,
    createLog,
    clearLogs,
    getStats,
  }
}

// Hook específico para estatísticas com SWR caching
export interface UseIntegrationLogsStatsReturn {
  stats: IntegrationStats | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

export function useIntegrationLogsStats(
  period: string = '24h'
): UseIntegrationLogsStatsReturn {
  const organizationId = useOrganizationId()
  
  const cacheKey = organizationId 
    ? `/api/integrations/logs/stats?period=${period}` 
    : null
  
  const { data, error, isLoading, mutate: swrMutate } = useSWR<LogStatsResponse>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 60 seconds for stats
    }
  )

  const mutate = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  return {
    stats: data?.data || null,
    isLoading,
    error: error || null,
    mutate,
  }
}

// Utility functions
export function formatLogDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatLogTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'agora'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}min atrás`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h atrás`
  } else {
    return formatLogDate(dateString)
  }
}

// Labels para tipos de integração
export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  CALENDLY: 'Calendly',
  TYPEBOT: 'Typebot',
  LINKEDIN: 'LinkedIn',
  N8N: 'n8n',
  MAKE: 'Make',
  ZAPIER: 'Zapier',
  WEBHOOK: 'Webhook',
  API: 'API',
}

// Categorias de integração
export type IntegrationCategory = 'meta' | 'other'

// Mapeamento de tipos para categorias
export const INTEGRATION_CATEGORIES: Record<IntegrationType, IntegrationCategory> = {
  WHATSAPP: 'meta',
  INSTAGRAM: 'meta',
  CALENDLY: 'other',
  TYPEBOT: 'other',
  LINKEDIN: 'other',
  N8N: 'other',
  MAKE: 'other',
  ZAPIER: 'other',
  WEBHOOK: 'other',
  API: 'other',
}

// Opções de categoria para filtro
export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas as Integrações' },
  { value: 'meta', label: 'API Oficial Meta (WhatsApp, Instagram)' },
  { value: 'other', label: 'Outras Integrações' },
] as const

// Função para filtrar logs por categoria
export function filterLogsByCategory(
  logs: IntegrationActivityLog[],
  category: IntegrationCategory | 'all'
): IntegrationActivityLog[] {
  if (category === 'all') return logs
  return logs.filter(log => INTEGRATION_CATEGORIES[log.integrationType] === category)
}

// Labels para tipos de atividade
export const ACTIVITY_TYPE_LABELS: Record<IntegrationActivityType, string> = {
  AUTH_CONNECTED: 'Autenticação Conectada',
  AUTH_DISCONNECTED: 'Autenticação Desconectada',
  AUTH_REFRESHED: 'Token Atualizado',
  AUTH_FAILED: 'Falha na Autenticação',
  WEBHOOK_RECEIVED: 'Webhook Recebido',
  WEBHOOK_SENT: 'Webhook Enviado',
  MESSAGE_SENT: 'Mensagem Enviada',
  MESSAGE_RECEIVED: 'Mensagem Recebida',
  SYNC_STARTED: 'Sincronização Iniciada',
  SYNC_COMPLETED: 'Sincronização Concluída',
  SYNC_FAILED: 'Falha na Sincronização',
  TEMPLATE_SENT: 'Template Enviado',
  ERROR: 'Erro',
  CONFIG_UPDATED: 'Configuração Atualizada',
}

// Labels para status
export const STATUS_LABELS: Record<IntegrationActivityStatus, string> = {
  SUCCESS: 'Sucesso',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  WARNING: 'Aviso',
}

// Cores para status
export const STATUS_COLORS: Record<IntegrationActivityStatus, string> = {
  SUCCESS: 'text-green-600 bg-green-50',
  PENDING: 'text-yellow-600 bg-yellow-50',
  FAILED: 'text-red-600 bg-red-50',
  WARNING: 'text-orange-600 bg-orange-50',
}

// Badge styles para status (para uso com Badge component)
export const STATUS_BADGE_STYLES: Record<IntegrationActivityStatus, string> = {
  SUCCESS: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  FAILED: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  WARNING: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
}

// Opções de status para filtro
export const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'SUCCESS', label: 'Sucesso' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'FAILED', label: 'Falhou' },
  { value: 'WARNING', label: 'Aviso' },
] as const

// Opções de tipo de integração para filtro
export const INTEGRATION_TYPE_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'CALENDLY', label: 'Calendly' },
  { value: 'TYPEBOT', label: 'Typebot' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'N8N', label: 'n8n' },
  { value: 'WEBHOOK', label: 'Webhook' },
] as const
