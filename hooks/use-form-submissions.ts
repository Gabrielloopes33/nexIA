"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FormSubmissionStats,
  PendingDeliveryListItem,
  DeliveryHistoryItem,
} from "@/types/form-webhook";
import { PendingFormDeliveryStatus } from "@prisma/client";

interface UseFormSubmissionsReturn {
  stats: FormSubmissionStats | null;
  pendingItems: PendingDeliveryListItem[];
  historyItems: DeliveryHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFormSubmissions(
  organizationId?: string
): UseFormSubmissionsReturn {
  const [stats, setStats] = useState<FormSubmissionStats | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingDeliveryListItem[]>(
    []
  );
  const [historyItems, setHistoryItems] = useState<DeliveryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = organizationId
        ? `?organizationId=${organizationId}`
        : "";

      // Fetch stats
      const statsRes = await fetch(`/api/form-submissions/stats${params}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch pending
      const pendingRes = await fetch(
        `/api/form-submissions/pending${params}&limit=10`
      );
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        if (pendingData.success) {
          setPendingItems(pendingData.data.items);
        }
      }

      // Fetch history
      const historyRes = await fetch(
        `/api/form-submissions/history${params}&limit=10`
      );
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistoryItems(historyData.data.items);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    pendingItems,
    historyItems,
    isLoading,
    error,
    refresh: fetchData,
  };
}

interface UsePendingDeliveriesReturn {
  items: PendingDeliveryListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePendingDeliveries(
  organizationId?: string,
  status?: PendingFormDeliveryStatus,
  page: number = 1,
  limit: number = 20
): UsePendingDeliveriesReturn {
  const [items, setItems] = useState<PendingDeliveryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (organizationId) params.append("organizationId", organizationId);
      if (status) params.append("status", status);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/form-submissions/pending?${params}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.error || "Erro ao carregar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, status, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, total, isLoading, error, refetch: fetchData };
}

interface UseDeliveryHistoryReturn {
  items: DeliveryHistoryItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDeliveryHistory(
  organizationId?: string,
  filters?: {
    status?: PendingFormDeliveryStatus;
    phone?: string;
    leadName?: string;
    startDate?: string;
    endDate?: string;
  },
  page: number = 1,
  limit: number = 20
): UseDeliveryHistoryReturn {
  const [items, setItems] = useState<DeliveryHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (organizationId) params.append("organizationId", organizationId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.phone) params.append("phone", filters.phone);
      if (filters?.leadName) params.append("leadName", filters.leadName);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/form-submissions/history?${params}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.error || "Erro ao carregar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, filters, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, total, isLoading, error, refetch: fetchData };
}

export async function reprocessDelivery(
  deliveryId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/form-submissions/${deliveryId}/reprocess`, {
    method: "POST",
  });
  return res.json();
}

export async function cancelDelivery(
  deliveryId: string,
  userId?: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/form-submissions/${deliveryId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, reason }),
  });
  return res.json();
}
