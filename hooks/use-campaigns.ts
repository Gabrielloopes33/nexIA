"use client"

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useOrganizationId } from '@/lib/contexts/organization-context'

export type CampaignStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type AudienceType = 'ALL' | 'BY_TAG' | 'MANUAL'
export type CampaignContactStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface Campaign {
  id: string
  organizationId: string
  name: string
  status: CampaignStatus
  instanceId: string
  templateName: string
  templateLanguage: string
  templateComponents?: unknown
  audienceType: AudienceType
  audienceTags: string[]
  totalContacts: number
  sentCount: number
  failedCount: number
  pendingCount: number
  startedAt?: string | null
  completedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  _count?: { contacts: number }
}

export interface CampaignContact {
  id: string
  campaignId: string
  contactId: string
  phone: string
  name?: string | null
  status: CampaignContactStatus
  externalMessageId?: string | null
  errorMessage?: string | null
  sentAt?: string | null
  failedAt?: string | null
  createdAt: string
}

export interface CreateCampaignData {
  name: string
  instanceId: string
  templateName: string
  templateLanguage: string
  templateComponents?: unknown
  audienceType: AudienceType
  audienceTags?: string[]
  contactIds?: string[]
}

export function useCampaigns() {
  const orgId = useOrganizationId()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    if (!orgId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar campanhas')
      setCampaigns(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas')
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const createCampaign = useCallback(async (data: CreateCampaignData): Promise<Campaign | null> => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Erro ao criar campanha')
      toast.success('Campanha criada com sucesso!')
      await fetchCampaigns()
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar campanha'
      toast.error(msg)
      return null
    }
  }, [fetchCampaigns])

  const sendCampaign = useCallback(async (id: string): Promise<{ sent: number; failed: number; total: number } | null> => {
    try {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'RUNNING' as CampaignStatus } : c))
      )
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Erro ao disparar campanha')
      toast.success(`Campanha disparada! ${result.data.sent} enviados, ${result.data.failed} falhas.`)
      await fetchCampaigns()
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao disparar campanha'
      toast.error(msg)
      await fetchCampaigns()
      return null
    }
  }, [fetchCampaigns])

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Erro ao excluir campanha')
      toast.success('Campanha excluída!')
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir campanha'
      toast.error(msg)
      return false
    }
  }, [])

  return { campaigns, isLoading, error, fetchCampaigns, createCampaign, sendCampaign, deleteCampaign }
}
