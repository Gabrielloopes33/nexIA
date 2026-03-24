"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationId } from "@/lib/contexts/organization-context";
import { NotificationType } from "@prisma/client";

export interface Notification {
  id: string;
  organizationId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
}

export function useNotifications(
  userId?: string,
  options?: { unreadOnly?: boolean; limit?: number }
): UseNotificationsReturn {
  const organizationId = useOrganizationId();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("organizationId", organizationId);
      if (userId) params.append("userId", userId);
      if (options?.unreadOnly) params.append("unreadOnly", "true");
      if (options?.limit) params.append("limit", options.limit.toString());

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao carregar notificações");
      }

      setNotifications(data.data || []);
      setUnreadCount(data.meta?.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar notificações");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, userId, options?.unreadOnly, options?.limit]);

  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar notificação como lida");
      }

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!organizationId) return false;

    try {
      const params = new URLSearchParams();
      params.append("organizationId", organizationId);
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/notifications/read-all?${params.toString()}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar notificações como lidas");
      }

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchNotifications();
    }
  }, [organizationId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
