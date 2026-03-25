"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationId } from "@/lib/contexts/organization-context";
import type { EvolutionInstanceResponse } from "@/lib/types/evolution";

export interface UseConnectedInstancesReturn {
  instances: EvolutionInstanceResponse[];
  isLoading: boolean;
  error: string | null;
  refreshInstances: () => Promise<void>;
}

/**
 * Hook para buscar apenas instâncias Evolution conectadas
 * Útil para seleção em conversas e envio de mensagens
 */
export function useConnectedInstances(): UseConnectedInstancesReturn {
  const organizationId = useOrganizationId();
  const [instances, setInstances] = useState<EvolutionInstanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/evolution/instances/connected?organizationId=${organizationId}`
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || "Erro ao carregar instâncias");
      setInstances(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar instâncias"
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    refreshInstances: fetchInstances,
  };
}
