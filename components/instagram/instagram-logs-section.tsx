"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { 
  ScrollText, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Database,
  Filter,
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface InstagramLog {
  id: string
  eventType: string
  status: "SUCCESS" | "ERROR" | "PENDING"
  message: string
  payload?: Record<string, unknown>
  createdAt: string
  instanceId?: string
}

// Mock logs data
const mockLogs: InstagramLog[] = [
  {
    id: "1",
    eventType: "MESSAGE_SENT",
    status: "SUCCESS",
    message: "Mensagem direct enviada com sucesso",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    payload: { recipient: "mariasilva", message: "Obrigada pela informação!" },
  },
  {
    id: "2",
    eventType: "WEBHOOK_RECEIVED",
    status: "SUCCESS",
    message: "Webhook de mensagem recebido",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    payload: { sender: "joaosantos", messageId: "msg_123" },
  },
  {
    id: "3",
    eventType: "MEDIA_FETCH",
    status: "SUCCESS",
    message: "Mídias sincronizadas com sucesso",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    payload: { count: 12 },
  },
  {
    id: "4",
    eventType: "INSIGHTS_FETCH",
    status: "ERROR",
    message: "Falha ao carregar métricas",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    payload: { error: "Rate limit exceeded" },
  },
  {
    id: "5",
    eventType: "ACCOUNT_SYNC",
    status: "SUCCESS",
    message: "Dados da conta sincronizados",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    payload: { followers: 1250, following: 450 },
  },
  {
    id: "6",
    eventType: "CONNECTION_CHECK",
    status: "PENDING",
    message: "Verificando status da conexão",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
]

const EVENT_TYPE_LABELS: Record<string, string> = {
  MESSAGE_SENT: "Envio de Mensagem",
  MESSAGE_RECEIVED: "Recebimento de Mensagem",
  WEBHOOK_RECEIVED: "Webhook Recebido",
  MEDIA_FETCH: "Sincronização de Mídias",
  INSIGHTS_FETCH: "Atualização de Métricas",
  ACCOUNT_SYNC: "Sincronização da Conta",
  CONNECTION_CHECK: "Verificação de Conexão",
  AUTH_REFRESH: "Atualização de Token",
}

interface InstagramLogsSectionProps {
  logs: InstagramLog[]
  isLoading?: boolean
  onRefresh: () => Promise<void>
  instance?: {
    id: string
    username: string
  } | null
}

export function InstagramLogsSection({
  logs,
  isLoading,
  onRefresh,
  instance,
}: InstagramLogsSectionProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<"ALL" | "SUCCESS" | "ERROR" | "PENDING">("ALL")

  const displayLogs = logs.length > 0 ? logs : mockLogs

  const filteredLogs = displayLogs.filter((log) =>
    filter === "ALL" ? true : log.status === filter
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return {
          badge: <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Sucesso</Badge>,
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          color: "border-l-emerald-500",
        }
      case "ERROR":
        return {
          badge: <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Erro</Badge>,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          color: "border-l-red-500",
        }
      case "PENDING":
        return {
          badge: <Badge variant="secondary" className="text-amber-600 bg-amber-100 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>,
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          color: "border-l-amber-500",
        }
      default:
        return {
          badge: <Badge variant="secondary">{status}</Badge>,
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          color: "border-l-gray-500",
        }
    }
  }

  const stats = {
    total: displayLogs.length,
    success: displayLogs.filter((l) => l.status === "SUCCESS").length,
    error: displayLogs.filter((l) => l.status === "ERROR").length,
    pending: displayLogs.filter((l) => l.status === "PENDING").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Database className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.success}</p>
                <p className="text-xs text-muted-foreground">Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.error}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
                <Filter className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Filtrar Logs</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredLogs.length} logs encontrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(["ALL", "SUCCESS", "ERROR", "PENDING"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 
                    "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white" : ""
                  }
                >
                  {f === "ALL" && "Todos"}
                  {f === "SUCCESS" && "Sucesso"}
                  {f === "ERROR" && "Erros"}
                  {f === "PENDING" && "Pendentes"}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <ScrollText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Histórico de Eventos</CardTitle>
              <CardDescription>
                Logs de eventos e operações do Instagram
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <ScrollText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não encontramos logs com o filtro selecionado.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const statusConfig = getStatusConfig(log.status)
                const isExpanded = expandedLogId === log.id

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "border-l-4 transition-colors",
                      statusConfig.color,
                      isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                    )}
                  >
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {statusConfig.icon}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {EVENT_TYPE_LABELS[log.eventType] || log.eventType}
                              </span>
                              {statusConfig.badge}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(log.createdAt))}
                              {log.instanceId && (
                                <>
                                  <span>•</span>
                                  <span>ID: {log.instanceId.slice(0, 8)}...</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && log.payload && (
                      <div className="px-4 pb-4">
                        <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Payload:</p>
                          <pre className="text-xs font-mono text-foreground">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
