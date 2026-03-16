"use client";

import { useState } from "react";
import { useDeliveryHistory } from "@/hooks/use-form-submissions";
import { StatusBadge } from "@/components/form-submissions/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, History, ArrowLeft, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { PendingFormDeliveryStatus } from "@prisma/client";

export default function HistoryPage() {
  const [filters, setFilters] = useState<{
    status?: PendingFormDeliveryStatus;
    phone?: string;
    leadName?: string;
  }>({});
  const [page, setPage] = useState(1);
  const limit = 20;

  const { items, total, isLoading, error, refetch } = useDeliveryHistory(
    undefined,
    filters,
    page,
    limit
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/meta-api/whatsapp/form-submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-blue-500" />
              Histórico de Entregas
            </h1>
            <p className="text-gray-600">
              {total} entregas no histórico
            </p>
          </div>
        </div>
        <Button onClick={refetch} disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              status:
                value === "all"
                  ? undefined
                  : (value as PendingFormDeliveryStatus),
            }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="COMPLETED">Concluído</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="EXPIRED">Expirado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por telefone"
          value={filters.phone || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, phone: e.target.value || undefined }))
          }
          className="w-48"
        />

        <Input
          placeholder="Buscar por nome"
          value={filters.leadName || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, leadName: e.target.value || undefined }))
          }
          className="w-48"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Concluído em</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-gray-500">Nenhum registro encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {item.leadName || "—"}
                      </span>
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
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-red-500">
                    {item.errorMessage || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {page} de {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
