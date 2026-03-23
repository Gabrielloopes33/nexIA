"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationId } from "@/lib/contexts/organization-context";
import type {
  EvolutionInstanceResponse,
  EvolutionQRCodeResponse,
} from "@/lib/types/evolution";

export interface UseEvolutionReturn {
  instances: EvolutionInstanceResponse[];
  isLoading: boolean;
  error: string | null;
  refreshInstances: () => Promise<void>;
  createInstance: (
    name: string
  ) => Promise<EvolutionInstanceResponse | null>;
  deleteInstance: (id: string) => Promise<boolean>;
  connectInstance: (id: string) => Promise<EvolutionQRCodeResponse | null>;
  disconnectInstance: (id: string) => Promise<boolean>;
  getInstanceStatus: (
    id: string
  ) => Promise<{ status: string; state: string } | null>;
}

export function useEvolution(): UseEvolutionReturn {
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
        `/api/evolution/instances?organizationId=${organizationId}`
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

  const createInstance = useCallback(
    async (name: string): Promise<EvolutionInstanceResponse | null> => {
      if (!organizationId) return null;

      try {
        const response = await fetch("/api/evolution/instances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId, name }),
        });
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "Erro ao criar instância");

        setInstances((prev) => [data.data, ...prev]);
        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao criar instância"
        );
        return null;
      }
    },
    [organizationId]
  );

  const deleteInstance = useCallback(
    async (id: string): Promise<boolean> => {
      if (!organizationId) return false;

      try {
        const response = await fetch(
          `/api/evolution/instances/${id}?organizationId=${organizationId}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "Erro ao excluir instância");

        setInstances((prev) => prev.filter((i) => i.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao excluir instância"
        );
        return false;
      }
    },
    [organizationId]
  );

  const connectInstance = useCallback(
    async (id: string): Promise<EvolutionQRCodeResponse | null> => {
      if (!organizationId) return null;

      try {
        const response = await fetch(
          `/api/evolution/instances/${id}/connect?organizationId=${organizationId}`,
          {
            method: "POST",
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "Erro ao gerar QR code");

        // Update local status
        setInstances((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: "CONNECTING" } : i
          )
        );

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao gerar QR code"
        );
        return null;
      }
    },
    [organizationId]
  );

  const disconnectInstance = useCallback(
    async (id: string): Promise<boolean> => {
      if (!organizationId) return false;

      try {
        const response = await fetch(
          `/api/evolution/instances/${id}/disconnect?organizationId=${organizationId}`,
          {
            method: "POST",
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "Erro ao desconectar");

        setInstances((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "DISCONNECTED",
                  phoneNumber: null,
                  profileName: null,
                }
              : i
          )
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao desconectar");
        return false;
      }
    },
    [organizationId]
  );

  const getInstanceStatus = useCallback(
    async (
      id: string
    ): Promise<{ status: string; state: string } | null> => {
      if (!organizationId) return null;

      try {
        const response = await fetch(
          `/api/evolution/instances/${id}/status?organizationId=${organizationId}`
        );
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error || "Erro ao verificar status");

        // Update local status
        setInstances((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: data.data.status } : i
          )
        );

        return data.data;
      } catch (err) {
        console.error("Error fetching status:", err);
        return null;
      }
    },
    [organizationId]
  );

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    refreshInstances: fetchInstances,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
    getInstanceStatus,
  };
}
