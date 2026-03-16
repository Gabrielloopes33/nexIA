"use client";

import { useState } from "react";
import { usePendingDeliveries } from "@/hooks/use-form-submissions";
import { PendingTable } from "@/components/form-submissions/pending-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PendingFormDeliveryStatus } from "@prisma/client";

export default function PendingPage() {
  const [status, setStatus] = useState<PendingFormDeliveryStatus | undefined>();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { items, total, isLoading, error, refetch } = usePendingDeliveries(
    undefined,
    status,
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
              <Clock className="h-6 w-6 text-amber-500" />
              Entregas Pendentes
            </h1>
            <p className="text-gray-600">
              {total} entregas aguardando processamento
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
      <div className="mb-4 flex gap-4">
        <Select
          value={status || "all"}
          onValueChange={(value) =>
            setStatus(
              value === "all" ? undefined : (value as PendingFormDeliveryStatus)
            )
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="WAITING">Aguardando</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <PendingTable items={items} onRefresh={refetch} />

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
