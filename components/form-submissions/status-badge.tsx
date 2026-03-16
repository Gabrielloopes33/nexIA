"use client";

import { PendingFormDeliveryStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PendingFormDeliveryStatus;
  className?: string;
}

const statusConfig: Record<
  PendingFormDeliveryStatus,
  { label: string; className: string }
> = {
  WAITING: {
    label: "Aguardando",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  PROCESSING: {
    label: "Processando",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  FAILED: {
    label: "Falhou",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  EXPIRED: {
    label: "Expirado",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function StatusIcon({ status }: { status: PendingFormDeliveryStatus }) {
  const icons: Record<PendingFormDeliveryStatus, string> = {
    WAITING: "⏳",
    PROCESSING: "🔄",
    COMPLETED: "✅",
    FAILED: "❌",
    EXPIRED: "⌛",
    CANCELLED: "🚫",
  };

  return <span className="text-base">{icons[status]}</span>;
}
