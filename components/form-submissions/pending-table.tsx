"use client";

import { PendingDeliveryListItem } from "@/types/form-webhook";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, X, FileText, Phone } from "lucide-react";
import { reprocessDelivery, cancelDelivery } from "@/hooks/use-form-submissions";
import { useState } from "react";
import { toast } from "sonner";

interface PendingTableProps {
  items: PendingDeliveryListItem[];
  onRefresh: () => void;
}

export function PendingTable({ items, onRefresh }: PendingTableProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleReprocess = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const result = await reprocessDelivery(id);
      if (result.success) {
        toast.success("Entrega reprocessada com sucesso");
        onRefresh();
      } else {
        toast.error(result.message || "Falha ao reprocessar");
      }
    } catch {
      toast.error("Erro ao reprocessar entrega");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta entrega?")) return;

    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const result = await cancelDelivery(id);
      if (result.success) {
        toast.success("Entrega cancelada com sucesso");
        onRefresh();
      } else {
        toast.error(result.message || "Falha ao cancelar");
      }
    } catch {
      toast.error("Erro ao cancelar entrega");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Nenhuma entrega pendente
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Todas as entregas foram processadas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Organização</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{item.leadName || "—"}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="h-3 w-3" />
                    {item.phone}
                  </span>
                </div>
              </TableCell>
              <TableCell>{item.organizationName}</TableCell>
              <TableCell>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                  {item.templateName}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
                {item.retryCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({item.retryCount} retries)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(item.expiresAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReprocess(item.id)}
                    disabled={processingIds.has(item.id)}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        processingIds.has(item.id) ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(item.id)}
                    disabled={processingIds.has(item.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
