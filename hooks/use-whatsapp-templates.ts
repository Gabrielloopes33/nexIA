"use client"

import { useState, useEffect, useCallback } from 'react'
import type { WhatsAppTemplate, CreateTemplateRequest } from '@/lib/whatsapp/types'
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  getTemplateAnalytics,
} from '@/lib/whatsapp/api'

interface UseWhatsAppTemplatesReturn {
  templates: WhatsAppTemplate[]
  isLoading: boolean
  error: string | null
  createNewTemplate: (request: CreateTemplateRequest) => Promise<void>
  removeTemplate: (templateId: string) => Promise<void>
  getAnalytics: (templateId: string) => Promise<{ sent: number; delivered: number; read: number }>
  refreshTemplates: () => Promise<void>
}

export function useWhatsAppTemplates(wabaId?: string): UseWhatsAppTemplatesReturn {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!wabaId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await getTemplates(wabaId)
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }, [wabaId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const createNewTemplate = useCallback(async (request: CreateTemplateRequest) => {
    if (!wabaId) {
      setError('WABA ID não disponível')
      return
    }
    
    setIsLoading(true)
    try {
      const newTemplate = await createTemplate(wabaId, request)
      setTemplates((prev) => [newTemplate, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [wabaId])

  const removeTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true)
    try {
      await deleteTemplate(templateId)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir template')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getAnalytics = useCallback(async (templateId: string) => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    return getTemplateAnalytics(templateId, {
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }, [])

  const refreshTemplates = useCallback(async () => {
    await fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    isLoading,
    error,
    createNewTemplate,
    removeTemplate,
    getAnalytics,
    refreshTemplates,
  }
}
