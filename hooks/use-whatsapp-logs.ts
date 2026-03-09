"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

export interface WhatsAppLog {
  id: string
  organizationId: string
  whatsappInstanceId: string | null
  instagramInstanceId: string | null
  eventType: string
  payload: Record<string, unknown> | null
  forwardedToN8n: boolean
  processed: boolean
  processedAt: string | null
  errorMessage: string | null
  createdAt: string
  instance?: {
    name: string
    phoneNumber: string
  }
}

export interface LogsPagination {
  total: number
  pages: number
  current: number
  limit: number
}

export interface LogsResponse {
  success: boolean
  data: {
    logs: WhatsAppLog[]
    pagination: LogsPagination
    stats?: {
      total: number
      today: number
      errors: number
      unprocessed: number
    }
  }
  error?: string
}

export interface UseWhatsAppLogsOptions {
  organizationId?: string
  instanceId?: string
  eventType?: string
  processed?: boolean | null
  limit?: number
  pollingInterval?: number | null // em ms, null para desabilitar
}

interface UseWhatsAppLogsReturn {
  logs: WhatsAppLog[]
  pagination: LogsPagination | null
  stats: {
    total: number
    today: number
    errors: number
    unprocessed: number
  } | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  currentPage: number
  fetchLogs: (page?: number) => Promise<void>
  refreshLogs: () => Promise<void>
  setPage: (page: number) => void
  clearFilters: () => void
}

// Hook para pegar organizationId do localStorage
function useOrganizationId(): string | undefined {
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    const saved = localStorage.getItem('current_organization_id')
    if (saved) {
      setOrgId(saved)
    }
  }, [])
  
  return orgId
}

export function useWhatsAppLogs(options: UseWhatsAppLogsOptions = {}): UseWhatsAppLogsReturn {
  const {
    organizationId: propOrgId,
    instanceId,
    eventType,
    processed,
    limit = 50,
    pollingInterval = null,
  } = options

  const hookOrgId = useOrganizationId()
  const organizationId = propOrgId || hookOrgId

  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [pagination, setPagination] = useState<LogsPagination | null>(null)
  const [stats, setStats] = useState<UseWhatsAppLogsReturn['stats']>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Ref para rastrear se o componente está montado
  const isMounted = useRef(true)

  const buildQueryString = useCallback((page: number) => {
    const params = new URLSearchParams()
    
    if (organizationId) {
      params.append('organizationId', organizationId)
    }
    if (instanceId && instanceId !== 'all') {
      params.append('instanceId', instanceId)
    }
    if (eventType && eventType !== 'all') {
      params.append('eventType', eventType)
    }
    if (processed !== null && processed !== undefined) {
      params.append('processed', processed.toString())
    }
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    return params.toString()
  }, [organizationId, instanceId, eventType, processed, limit])

  const fetchLogs = useCallback(async (page: number = currentPage, showRefreshIndicator = false) => {
    if (!organizationId) return

    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const queryString = buildQueryString(page)
      const response = await fetch(`/api/whatsapp/logs?${queryString}`)
      const data: LogsResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar logs')
      }

      if (isMounted.current) {
        setLogs(data.data.logs || [])
        setPagination(data.data.pagination || null)
        setStats(data.data.stats || null)
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar logs')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [organizationId, buildQueryString, currentPage])

  const refreshLogs = useCallback(async () => {
    await fetchLogs(currentPage, true)
  }, [fetchLogs, currentPage])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
    fetchLogs(page)
  }, [fetchLogs])

  const clearFilters = useCallback(() => {
    setCurrentPage(1)
    fetchLogs(1)
  }, [fetchLogs])

  // Fetch inicial
  useEffect(() => {
    isMounted.current = true
    
    if (organizationId) {
      fetchLogs(1)
    }

    return () => {
      isMounted.current = false
    }
  }, [organizationId, instanceId, eventType, processed]) // Refetch quando filtros mudam

  // Polling
  useEffect(() => {
    if (!pollingInterval || !organizationId) return

    const intervalId = setInterval(() => {
      refreshLogs()
    }, pollingInterval)

    return () => clearInterval(intervalId)
  }, [pollingInterval, organizationId, refreshLogs])

  return {
    logs,
    pagination,
    stats,
    isLoading,
    isRefreshing,
    error,
    currentPage,
    fetchLogs,
    refreshLogs,
    setPage,
    clearFilters,
  }
}

// Hook para buscar estatísticas de logs
export function useWhatsAppLogsStats(organizationId?: string) {
  const hookOrgId = useOrganizationId()
  const orgId = organizationId || hookOrgId
  
  const [stats, setStats] = useState<{
    total: number
    today: number
    errors: number
    unprocessed: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!orgId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/whatsapp/logs/stats?organizationId=${orgId}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar estatísticas')
      }

      setStats(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, isLoading, error, refreshStats: fetchStats }
}

// Formatadores
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

// Labels para tipos de evento
export const EVENT_TYPE_LABELS: Record<string, string> = {
  message_received: 'Mensagem Recebida',
  message_sent: 'Mensagem Enviada',
  status_update: 'Atualização de Status',
  template_update: 'Atualização de Template',
  webhook_verify: 'Verificação de Webhook',
  error: 'Erro',
}

export const EVENT_TYPES = [
  { value: 'message_received', label: 'Mensagem Recebida' },
  { value: 'message_sent', label: 'Mensagem Enviada' },
  { value: 'status_update', label: 'Atualização de Status' },
  { value: 'template_update', label: 'Atualização de Template' },
  { value: 'webhook_verify', label: 'Verificação de Webhook' },
  { value: 'error', label: 'Erro' },
]
