"use client"

/**
 * Hook para atribuição em lote de conversas
 * Usa TanStack Query (SWR) para mutations e cache
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface BulkAssignParams {
  conversationIds: string[]
  agentId: string
}

interface BulkUnassignParams {
  conversationIds: string[]
}

interface BulkAssignResult {
  success: boolean
  updated: number
  agent?: {
    id: string
    name: string
    email: string
  }
  assignments?: Array<{
    conversationId: string
    assignedTo: string | null
    status: string
  }>
  error?: string
}

interface UseBulkAssignReturn {
  // Mutações
  assign: (params: BulkAssignParams) => Promise<BulkAssignResult>
  unassign: (params: BulkUnassignParams) => Promise<BulkAssignResult>
  
  // Estado
  isLoading: boolean
  error: string | null
  lastResult: BulkAssignResult | null
}

export function useBulkAssign(): UseBulkAssignReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<BulkAssignResult | null>(null)

  const assign = useCallback(async (params: BulkAssignParams): Promise<BulkAssignResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/conversations/batch-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || "Erro ao atribuir conversas"
        setError(errorMessage)
        toast.error("Erro na atribuição", {
          description: errorMessage,
        })
        return {
          success: false,
          updated: 0,
          error: errorMessage,
        }
      }

      setLastResult(result)
      
      const count = result.updated || 0
      const agentName = result.agent?.name || "agente"
      
      toast.success(
        count === 1 
          ? "Conversa atribuída" 
          : `${count} conversas atribuídas`,
        {
          description: `Atribuídas a ${agentName}`,
        }
      )

      return {
        success: true,
        updated: count,
        agent: result.agent,
        assignments: result.assignments,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      toast.error("Erro na atribuição", {
        description: errorMessage,
      })
      return {
        success: false,
        updated: 0,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unassign = useCallback(async (params: BulkUnassignParams): Promise<BulkAssignResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/conversations/batch-assign", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || "Erro ao remover atribuições"
        setError(errorMessage)
        toast.error("Erro ao desatribuir", {
          description: errorMessage,
        })
        return {
          success: false,
          updated: 0,
          error: errorMessage,
        }
      }

      setLastResult(result)
      
      const count = result.updated || 0
      
      toast.success(
        count === 1 
          ? "Atribuição removida" 
          : `${count} atribuições removidas`,
        {
          description: "As conversas estão disponíveis novamente",
        }
      )

      return {
        success: true,
        updated: count,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      toast.error("Erro ao desatribuir", {
        description: errorMessage,
      })
      return {
        success: false,
        updated: 0,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    assign,
    unassign,
    isLoading,
    error,
    lastResult,
  }
}
