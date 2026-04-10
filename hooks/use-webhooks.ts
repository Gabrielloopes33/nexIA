"use client"

import { useState, useEffect, useCallback } from 'react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export interface Webhook {
  id: string
  organizationId: string
  name: string
  url: string
  events: string[]
  headers?: Record<string, string> | null
  status: 'active' | 'paused' | 'error'
  lastTriggeredAt: string | null
  lastResponseStatus: number | null
  retryCount: number
  createdAt: string
  updatedAt: string
  source?: 'custom' | 'integration'
  readOnly?: boolean
  integrationType?: 'TYPEBOT' | 'LINKEDIN' | 'META' | 'WEBHOOK'
}

export interface CreateWebhookData {
  name: string
  url: string
  events: string[]
  headers?: Record<string, string>
  retryCount?: number
}

export interface UpdateWebhookData {
  name?: string
  url?: string
  events?: string[]
  headers?: Record<string, string>
  status?: 'active' | 'paused' | 'error'
  retryCount?: number
}

export interface TestWebhookResult {
  status: 'success' | 'error'
  statusCode?: number
  responseTime: number
  responseBody?: string
  requestPayload: Record<string, unknown>
  error?: string
}

interface UseWebhooksReturn {
  webhooks: Webhook[]
  isLoading: boolean
  error: string | null
  refreshWebhooks: () => Promise<void>
  createWebhook: (data: CreateWebhookData) => Promise<Webhook | null>
  updateWebhook: (id: string, data: UpdateWebhookData) => Promise<Webhook | null>
  deleteWebhook: (id: string) => Promise<boolean>
  testWebhook: (id: string) => Promise<TestWebhookResult | null>
  toggleWebhookStatus: (id: string, currentStatus: 'active' | 'paused') => Promise<Webhook | null>
}

const VALID_EVENTS = [
  { value: 'contact.created', label: 'Contato Criado', category: 'Contatos' },
  { value: 'contact.updated', label: 'Contato Atualizado', category: 'Contatos' },
  { value: 'contact.deleted', label: 'Contato Removido', category: 'Contatos' },
  { value: 'deal.created', label: 'Negócio Criado', category: 'Negócios' },
  { value: 'deal.updated', label: 'Negócio Atualizado', category: 'Negócios' },
  { value: 'deal.won', label: 'Negócio Ganho', category: 'Negócios' },
  { value: 'deal.lost', label: 'Negócio Perdido', category: 'Negócios' },
  { value: 'deal.stage_changed', label: 'Etapa Alterada', category: 'Negócios' },
  { value: 'message.received', label: 'Mensagem Recebida', category: 'Mensagens' },
  { value: 'message.sent', label: 'Mensagem Enviada', category: 'Mensagens' },
  { value: 'schedule.created', label: 'Agendamento Criado', category: 'Agendamentos' },
  { value: 'schedule.completed', label: 'Agendamento Concluído', category: 'Agendamentos' },
  { value: 'campaign.started', label: 'Campanha Iniciada', category: 'Campanhas' },
  { value: 'campaign.completed', label: 'Campanha Concluída', category: 'Campanhas' },
]

export function useWebhooks(): UseWebhooksReturn {
  const organizationId = useOrganizationId()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/integrations/webhooks?organizationId=${organizationId}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar webhooks')
      }

      setWebhooks(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar webhooks')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const createWebhook = async (webhookData: CreateWebhookData): Promise<Webhook | null> => {
    if (!organizationId) {
      setError('Organização não encontrada')
      return null
    }

    try {
      const response = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...webhookData,
          organizationId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar webhook')
      }

      await fetchWebhooks()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar webhook'
      setError(message)
      throw new Error(message)
    }
  }

  const updateWebhook = async (id: string, webhookData: UpdateWebhookData): Promise<Webhook | null> => {
    if (!organizationId) {
      setError('Organização não encontrada')
      return null
    }

    try {
      const response = await fetch(`/api/integrations/webhooks/${id}?organizationId=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar webhook')
      }

      await fetchWebhooks()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar webhook'
      setError(message)
      throw new Error(message)
    }
  }

  const deleteWebhook = async (id: string): Promise<boolean> => {
    if (!organizationId) {
      setError('Organização não encontrada')
      return false
    }

    try {
      const response = await fetch(`/api/integrations/webhooks/${id}?organizationId=${organizationId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover webhook')
      }

      await fetchWebhooks()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover webhook'
      setError(message)
      throw new Error(message)
    }
  }

  const testWebhook = async (id: string): Promise<TestWebhookResult | null> => {
    try {
      const response = await fetch('/api/integrations/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao testar webhook')
      }

      await fetchWebhooks()
      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao testar webhook'
      setError(message)
      throw new Error(message)
    }
  }

  const toggleWebhookStatus = async (
    id: string,
    currentStatus: 'active' | 'paused'
  ): Promise<Webhook | null> => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    return updateWebhook(id, { status: newStatus })
  }

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  return {
    webhooks,
    isLoading,
    error,
    refreshWebhooks: fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    toggleWebhookStatus,
  }
}

export { VALID_EVENTS }
