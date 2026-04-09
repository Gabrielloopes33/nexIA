'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface Pipeline {
  id: string
  name: string
  color: string
  type: 'vendas' | 'follow_up' | 'pos_venda' | 'outro'
  isActive: boolean
  isDefault: boolean
  stages: PipelineStage[]
  organizationId: string
  productId: string
  product?: {
    id: string
    name: string
    color: string
  }
  _count: {
    deals: number
    automations: number
  }
  createdAt: string
  updatedAt: string
}

export interface PipelineStage {
  id: string
  name: string
  position: number
  color: string | null
  probability: number | null
  isDefault: boolean | null
  isClosed: boolean | null
}

interface PipelinesApiResponse {
  success: boolean
  data: {
    pipelines: Pipeline[]
    totalCount: number
    defaultPipelineId: string | null
  }
}

const PIPELINES_QUERY_KEY = 'dashboard-pipelines'

/**
 * Faz o fetch dos pipelines da organização
 */
async function fetchPipelines(): Promise<PipelinesApiResponse['data']> {
  const response = await fetch('/api/pipelines')
  
  if (!response.ok) {
    throw new Error('Failed to fetch pipelines')
  }
  
  const result: PipelinesApiResponse = await response.json()
  
  if (!result.success) {
    throw new Error('Failed to fetch pipelines')
  }
  
  return result.data
}

/**
 * Hook para buscar os pipelines da organização no dashboard
 * 
 * @returns Query result com lista de pipelines e o ID do pipeline padrão
 * 
 * @example
 * ```typescript
 * const { pipelines, defaultPipelineId, isLoading } = useDashboardPipelines()
 * 
 * // Usar o pipeline padrão
 * const selectedPipeline = pipelines.find(p => p.id === defaultPipelineId)
 * ```
 */
export function useDashboardPipelines() {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [PIPELINES_QUERY_KEY],
    queryFn: fetchPipelines,
    staleTime: 10 * 60 * 1000, // 10 minutos - pipelines mudam pouco
    refetchOnWindowFocus: false,
  })
  
  return {
    pipelines: query.data?.pipelines ?? [],
    defaultPipelineId: query.data?.defaultPipelineId ?? null,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [PIPELINES_QUERY_KEY] })
    },
  }
}

export default useDashboardPipelines
