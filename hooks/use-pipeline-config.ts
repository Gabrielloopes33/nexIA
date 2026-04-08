/**
 * Hook para gerenciamento de Multi-Pipelines e Automações
 * 
 * @module hooks/use-pipeline-config
 * @description Hook principal para CRUD de pipelines e automações
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Pipeline,
  Automation,
  CreatePipelineInput,
  UpdatePipelineInput,
  CreateAutomationInput,
  UpdateAutomationInput,
  ListPipelinesResponse,
  ListAutomationsResponse,
} from '@/types/pipeline-config'

// ============================================================================
// Types do Hook
// ============================================================================

interface UsePipelineConfigOptions {
  organizationId: string
  productId?: string
  autoFetch?: boolean
}

interface UsePipelineConfigReturn {
  // Pipelines
  pipelines: Pipeline[]
  defaultPipeline: Pipeline | null
  activePipelines: Pipeline[]
  isLoadingPipelines: boolean
  fetchPipelines: () => Promise<void>
  createPipeline: (data: CreatePipelineInput) => Promise<Pipeline>
  updatePipeline: (id: string, data: UpdatePipelineInput) => Promise<Pipeline>
  deletePipeline: (id: string) => Promise<void>
  setDefaultPipeline: (id: string) => Promise<void>
  togglePipeline: (id: string, isActive: boolean) => Promise<void>
  
  // Automações
  automations: Automation[]
  activeAutomations: Automation[]
  isLoadingAutomations: boolean
  fetchAutomations: () => Promise<void>
  createAutomation: (data: CreateAutomationInput) => Promise<Automation>
  updateAutomation: (id: string, data: UpdateAutomationInput) => Promise<Automation>
  deleteAutomation: (id: string) => Promise<void>
  toggleAutomation: (id: string, isActive: boolean) => Promise<void>
  duplicateAutomation: (id: string) => Promise<Automation>
  
  // Utilidades
  getAutomationsForStage: (pipelineId: string, stageId: string) => Automation[]
  getPipelineById: (id: string) => Pipeline | undefined
  refresh: () => Promise<void>
  isLoading: boolean
  error: Error | null
  clearError: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function usePipelineConfig(
  options: UsePipelineConfigOptions
): UsePipelineConfigReturn {
  const { organizationId, productId, autoFetch = true } = options
  
  // Estados
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(false)
  const [isLoadingAutomations, setIsLoadingAutomations] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Computed
  const isLoading = isLoadingPipelines || isLoadingAutomations
  
  // Garantir que pipelines e automations sejam sempre arrays
  const safePipelines = Array.isArray(pipelines) ? pipelines : []
  const safeAutomations = Array.isArray(automations) ? automations : []
  
  const defaultPipeline = useMemo(() => 
    safePipelines.find(p => p.isDefault) || null,
    [safePipelines]
  )
  
  const activePipelines = useMemo(() => 
    safePipelines.filter(p => p.isActive),
    [safePipelines]
  )
  
  const activeAutomations = useMemo(() => 
    safeAutomations.filter(a => a.isActive),
    [safeAutomations]
  )
  
  // Helpers
  const handleError = useCallback((err: unknown, message: string) => {
    const error = err instanceof Error ? err : new Error(message)
    setError(error)
    toast.error(message)
    console.error(message, err)
    throw error
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  // ============================================================================
  // Fetch Functions
  // ============================================================================
  
  const fetchPipelines = useCallback(async () => {
    if (!organizationId) return
    
    setIsLoadingPipelines(true)
    try {
      const params = new URLSearchParams({ organizationId })
      if (productId) params.append('productId', productId)
      
      const response = await fetch(`/api/pipelines?${params}`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar pipelines')
      }
      
      const result = await response.json()
      const data: ListPipelinesResponse = result.data || { pipelines: [], totalCount: 0, defaultPipelineId: null }
      setPipelines(data.pipelines || [])
    } catch (err) {
      handleError(err, 'Erro ao carregar pipelines')
    } finally {
      setIsLoadingPipelines(false)
    }
  }, [organizationId, productId, handleError])
  
  const fetchAutomations = useCallback(async () => {
    if (!organizationId) return
    
    setIsLoadingAutomations(true)
    try {
      const params = new URLSearchParams({ organizationId })
      if (productId) params.append('productId', productId)
      
      const response = await fetch(`/api/automations?${params}`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar automações')
      }
      
      const result = await response.json()
      const data: ListAutomationsResponse = result.data || { automations: [], totalCount: 0, activeCount: 0 }
      setAutomations(data.automations || [])
    } catch (err) {
      handleError(err, 'Erro ao carregar automações')
    } finally {
      setIsLoadingAutomations(false)
    }
  }, [organizationId, productId, handleError])
  
  const refresh = useCallback(async () => {
    await Promise.all([fetchPipelines(), fetchAutomations()])
  }, [fetchPipelines, fetchAutomations])
  
  // ============================================================================
  // Pipeline CRUD
  // ============================================================================
  
  const createPipeline = useCallback(async (
    data: CreatePipelineInput
  ): Promise<Pipeline> => {
    try {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao criar pipeline')
      }
      
      const pipeline: Pipeline = await response.json()
      setPipelines(prev => [...prev, pipeline])
      toast.success(`Pipeline "${pipeline.name}" criado com sucesso`)
      return pipeline
    } catch (err) {
      return handleError(err, 'Erro ao criar pipeline')
    }
  }, [organizationId, handleError])
  
  const updatePipeline = useCallback(async (
    id: string,
    data: UpdatePipelineInput
  ): Promise<Pipeline> => {
    try {
      const response = await fetch(`/api/pipelines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao atualizar pipeline')
      }
      
      const pipeline: Pipeline = await response.json()
      setPipelines(prev => 
        prev.map(p => p.id === id ? pipeline : p)
      )
      toast.success('Pipeline atualizado com sucesso')
      return pipeline
    } catch (err) {
      return handleError(err, 'Erro ao atualizar pipeline')
    }
  }, [handleError])
  
  const deletePipeline = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/pipelines/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao excluir pipeline')
      }
      
      setPipelines(prev => prev.filter(p => p.id !== id))
      setAutomations(prev => 
        prev.filter(a => 
          a.trigger.pipelineId !== id && 
          a.action.targetPipelineId !== id
        )
      )
      toast.success('Pipeline excluído com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao excluir pipeline')
    }
  }, [handleError])
  
  const setDefaultPipeline = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/pipelines/${id}/default`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Falha ao definir pipeline padrão')
      }
      
      setPipelines(prev => 
        prev.map(p => ({
          ...p,
          isDefault: p.id === id,
        }))
      )
      toast.success('Pipeline padrão atualizado')
    } catch (err) {
      handleError(err, 'Erro ao definir pipeline padrão')
    }
  }, [handleError])
  
  const togglePipeline = useCallback(async (
    id: string, 
    isActive: boolean
  ): Promise<void> => {
    try {
      await updatePipeline(id, { isActive })
      
      if (!isActive) {
        // Desativa automações relacionadas
        const relatedAutomations = automations.filter(
          a => a.trigger.pipelineId === id || a.action.targetPipelineId === id
        )
        
        for (const automation of relatedAutomations) {
          if (automation.isActive) {
            await toggleAutomation(automation.id, false)
          }
        }
      }
      
      toast.success(
        isActive 
          ? 'Pipeline ativado' 
          : 'Pipeline desativado. Automações relacionadas foram pausadas.'
      )
    } catch (err) {
      handleError(err, 'Erro ao alterar estado do pipeline')
    }
  }, [updatePipeline, automations, handleError])
  
  // ============================================================================
  // Automation CRUD
  // ============================================================================
  
  const createAutomation = useCallback(async (
    data: CreateAutomationInput
  ): Promise<Automation> => {
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao criar automação')
      }
      
      const automation: Automation = await response.json()
      setAutomations(prev => [...prev, automation])
      toast.success('Automação criada com sucesso')
      return automation
    } catch (err) {
      return handleError(err, 'Erro ao criar automação')
    }
  }, [organizationId, handleError])
  
  const updateAutomation = useCallback(async (
    id: string,
    data: UpdateAutomationInput
  ): Promise<Automation> => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao atualizar automação')
      }
      
      const automation: Automation = await response.json()
      setAutomations(prev => 
        prev.map(a => a.id === id ? automation : a)
      )
      toast.success('Automação atualizada com sucesso')
      return automation
    } catch (err) {
      return handleError(err, 'Erro ao atualizar automação')
    }
  }, [handleError])
  
  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha ao excluir automação')
      }
      
      setAutomations(prev => prev.filter(a => a.id !== id))
      toast.success('Automação excluída com sucesso')
    } catch (err) {
      handleError(err, 'Erro ao excluir automação')
    }
  }, [handleError])
  
  const toggleAutomation = useCallback(async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    try {
      await updateAutomation(id, { isActive })
      toast.success(isActive ? 'Automação ativada' : 'Automação pausada')
    } catch (err) {
      handleError(err, 'Erro ao alterar estado da automação')
    }
  }, [updateAutomation, handleError])
  
  const duplicateAutomation = useCallback(async (id: string): Promise<Automation> => {
    try {
      const automation = automations.find(a => a.id === id)
      if (!automation) {
        throw new Error('Automação não encontrada')
      }
      
      const { id: _, createdAt, updatedAt, executionCount, ...data } = automation
      
      const newAutomation = await createAutomation({
        name: `${automation.name || 'Automação'} (cópia)`,
        trigger: data.trigger,
        conditions: data.conditions,
        action: data.action,
      })
      
      toast.success('Automação duplicada com sucesso')
      return newAutomation
    } catch (err) {
      return handleError(err, 'Erro ao duplicar automação')
    }
  }, [automations, createAutomation, handleError])
  
  // ============================================================================
  // Utilities
  // ============================================================================
  
  const getAutomationsForStage = useCallback((
    pipelineId: string,
    stageId: string
  ): Automation[] => {
    return safeAutomations.filter(
      a => a.trigger?.pipelineId === pipelineId && 
           a.trigger?.stageId === stageId &&
           a.isActive
    )
  }, [safeAutomations])
  
  const getPipelineById = useCallback((id: string): Pipeline | undefined => {
    return safePipelines.find(p => p.id === id)
  }, [safePipelines])
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  useEffect(() => {
    if (autoFetch && organizationId && !isInitialized) {
      refresh().then(() => setIsInitialized(true))
    }
  }, [organizationId, productId, autoFetch, refresh, isInitialized])
  
  return {
    // Pipelines - garantir que nunca seja undefined
    pipelines: safePipelines,
    defaultPipeline,
    activePipelines,
    isLoadingPipelines,
    fetchPipelines,
    createPipeline,
    updatePipeline,
    deletePipeline,
    setDefaultPipeline,
    togglePipeline,
    
    // Automações - garantir que nunca seja undefined
    automations: safeAutomations,
    activeAutomations,
    isLoadingAutomations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    duplicateAutomation,
    
    // Utilidades
    getAutomationsForStage,
    getPipelineById,
    refresh,
    isLoading,
    error,
    clearError,
  }
}

export default usePipelineConfig
