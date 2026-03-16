"use client";

import { useFormSubmissions } from "@/hooks/use-form-submissions";
import { StatsCards } from "@/components/form-submissions/stats-cards";
import { PendingTable } from "@/components/form-submissions/pending-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, FileText, Clock, History } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/form-submissions/status-badge";

export default function FormSubmissionsPage() {
  const { stats, pendingItems, historyItems, isLoading, refresh } =
    useFormSubmissions();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Envio de Formulários</h1>
          <p className="text-gray-600">
            Gerencie entregas de PDFs do Plano de Ação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/meta-api/whatsapp/form-submissions/pending">
              <Clock className="mr-2 h-4 w-4" />
              Ver Pendentes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/meta-api/whatsapp/form-submissions/history">
              <History className="mr-2 h-4 w-4" />
              Ver Histórico
            </Link>
          </Button>
          <Button onClick={refresh} disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <StatsCards stats={stats} isLoading={isLoading} />
      </div>

      {/* Recent Pending */}
      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Entregas Pendentes Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meta-api/whatsapp/form-submissions/pending">
                Ver todas
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingItems.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <p>Nenhuma entrega pendente no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {item.leadName || item.phone}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.organizationName} • {item.templateName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status} />
                      <span className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Histórico Recente
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/meta-api/whatsapp/form-submissions/history">
              Ver todas
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <History className="mx-auto mb-2 h-8 w-8" />
              <p>Sem histórico ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {item.leadName || item.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.pdfFilename}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-sm text-gray-500">
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleDateString("pt-BR")
                        : new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
