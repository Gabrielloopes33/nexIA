"use client"

import { useState, useCallback } from 'react'
import type { WhatsAppTemplate } from '@/lib/whatsapp/types'

interface SyncResult {
  success: boolean
  totalTemplates: number
  upserted: number
  failed: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
}

interface UseWhatsAppTemplatesSyncReturn {
  templates: WhatsAppTemplate[]
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  syncResult: SyncResult | null
  loadTemplates: (instanceId: string) => Promise<void>
  syncTemplates: (instanceId: string) => Promise<SyncResult | null>
}

export function useWhatsAppTemplatesSync(): UseWhatsAppTemplatesSyncReturn {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const loadTemplates = useCallback(async (instanceId: string) => {
    if (!instanceId) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/whatsapp/templates?instanceId=${instanceId}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar templates')
      }
      
      // Mapear os templates do banco para o formato esperado pela UI
      const mappedTemplates: WhatsAppTemplate[] = (data.data?.templates || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        category: t.category as WhatsAppTemplate['category'],
        status: t.status as WhatsAppTemplate['status'],
        language: t.language as string,
        components: (t.components as Record<string, unknown>[]) || [],
        rejectedReason: t.reason as string | undefined,
        allowCategoryChange: false,
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        updatedAt: (t.updatedAt as string) || new Date().toISOString(),
      }))
      
      setTemplates(mappedTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const syncTemplates = useCallback(async (instanceId: string): Promise<SyncResult | null> => {
    if (!instanceId) {
      setError('Selecione uma instância para sincronizar')
      return null
    }
    
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)
    
    try {
      const response = await fetch('/api/whatsapp/templates/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceId }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao sincronizar templates')
      }
      
      const result: SyncResult = {
        success: true,
        totalTemplates: data.data.totalTemplates,
        upserted: data.data.upserted,
        failed: data.data.failed,
        byStatus: data.data.byStatus,
        byCategory: data.data.byCategory,
      }
      
      setSyncResult(result)
      
      // Recarregar templates após sincronização
      await loadTemplates(instanceId)
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar templates')
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [loadTemplates])

  return {
    templates,
    isLoading,
    isSyncing,
    error,
    syncResult,
    loadTemplates,
    syncTemplates,
  }
}
