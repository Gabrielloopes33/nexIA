"use client";

import { useState, useEffect, useCallback } from "react";

interface ActiveDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  leadScore: number;
  stage: {
    id: string;
    name: string;
    color: string;
  };
}

interface UseActiveDealResult {
  deal: ActiveDeal | null;
  hasActiveDeal: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useActiveDeal(contactId: string | undefined): UseActiveDealResult {
  const [deal, setDeal] = useState<ActiveDeal | null>(null);
  const [hasActiveDeal, setHasActiveDeal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchActiveDeal = useCallback(async () => {
    if (!contactId) {
      setDeal(null);
      setHasActiveDeal(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}/active-deal`);
      const data = await response.json();

      if (data.success) {
        setHasActiveDeal(data.data.hasActiveDeal);
        setDeal(data.data.deal);
      } else {
        setError(new Error(data.error || "Failed to fetch active deal"));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchActiveDeal();
  }, [fetchActiveDeal]);

  return {
    deal,
    hasActiveDeal,
    isLoading,
    error,
    refetch: fetchActiveDeal,
  };
}
