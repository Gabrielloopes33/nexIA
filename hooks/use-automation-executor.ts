'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

interface AutomationLog {
  id: string;
  automationId: string;
  dealId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED';
  actionType: string;
  conditionsMatched: boolean;
  errorMessage?: string;
  previousData?: Record<string, any>;
  resultData?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  deal?: {
    id: string;
    title: string;
  };
}

interface ExecuteAutomationResponse {
  success: boolean;
  message?: string;
  error?: string;
  result?: {
    status: string;
    dealId: string;
  };
}

interface AutomationLogsResponse {
  success: boolean;
  logs: AutomationLog[];
  error?: string;
}

/**
 * Hook para execução manual de automações e consulta de logs
 */
export function useAutomationExecutor() {
  /**
   * Executa uma automação manualmente para um deal específico
   */
  const executeManualAutomation = useCallback(async (
    automationId: string, 
    dealId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/automations/${automationId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId })
      });
      
      const data: ExecuteAutomationResponse = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Automação executada com sucesso');
        return true;
      } else {
        toast.error(data.error || 'Erro ao executar automação');
        return false;
      }
    } catch (error) {
      console.error('[useAutomationExecutor] Erro ao executar automação:', error);
      toast.error('Erro ao executar automação');
      return false;
    }
  }, []);

  /**
   * Busca os logs de execução de uma automação
   */
  const getAutomationLogs = useCallback(async (
    automationId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED';
    } = {}
  ): Promise<AutomationLog[]> => {
    const { limit = 50, offset = 0, status } = options;
    
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(
        `/api/automations/${automationId}/logs?${params.toString()}`
      );
      
      const data: AutomationLogsResponse = await response.json();
      
      if (data.success) {
        return data.logs || [];
      } else {
        console.error('[useAutomationExecutor] Erro ao buscar logs:', data.error);
        return [];
      }
    } catch (error) {
      console.error('[useAutomationExecutor] Erro ao buscar logs:', error);
      return [];
    }
  }, []);

  /**
   * Executa múltiplas automações em sequência
   */
  const executeBulkAutomations = useCallback(async (
    automationId: string,
    dealIds: string[]
  ): Promise<{ success: string[]; failed: string[] }> => {
    const results = { success: [] as string[], failed: [] as string[] };
    
    for (const dealId of dealIds) {
      const success = await executeManualAutomation(automationId, dealId);
      if (success) {
        results.success.push(dealId);
      } else {
        results.failed.push(dealId);
      }
      
      // Pequeno delay para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }, [executeManualAutomation]);

  return {
    executeManualAutomation,
    getAutomationLogs,
    executeBulkAutomations
  };
}

export default useAutomationExecutor;
