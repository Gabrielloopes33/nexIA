"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Clock,
  Loader2,
  RefreshCw,
  Layers,
  Smartphone,
  Webhook,
  MessageSquare,
  Bot,
  CalendarDays,
  Linkedin,
  Zap,
  Filter,
  Inbox
} from "lucide-react"
import { 
  useIntegrationLogs, 
  useIntegrationLogsStats,
  INTEGRATION_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
  CATEGORY_OPTIONS,
  INTEGRATION_CATEGORIES,
  type IntegrationActivityLog,
  type IntegrationType,
  type IntegrationActivityStatus
} from "@/hooks/use-integration-logs"

// Icones para tipos de integração
const INTEGRATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WHATSAPP: Smartphone,
  INSTAGRAM: Smartphone,
  CALENDLY: CalendarDays,
  TYPEBOT: Bot,
  LINKEDIN: Linkedin,
  N8N: Zap,
  MAKE: Zap,
  ZAPIER: Zap,
  WEBHOOK: Webhook,
  API: Webhook,
}

// Icones para status
const STATUS_ICONS: Record<IntegrationActivityStatus, React.ComponentType<{ className?: string }>> = {
  SUCCESS: CheckCircle2,
  PENDING: Clock,
  FAILED: XCircle,
  WARNING: AlertTriangle,
}

// Cores para os cards de estatísticas
const STAT_COLORS = {
  total: "text-[#46347F]",
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-amber-600",
}

export default function LogsPage() {
  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("all")
  const [filtroIntegracao, setFiltroIntegracao] = useState<string>("all")
  const [filtroStatus, setFiltroStatus] = useState<string>("all")
  const [filtroData, setFiltroData] = useState<string>("all")

  // Calcula datas para filtro
  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    
    switch (filtroData) {
      case "24h":
        start.setDate(start.getDate() - 1)
        break
      case "7d":
        start.setDate(start.getDate() - 7)
        break
      case "30d":
        start.setDate(start.getDate() - 30)
        break
      default:
        return { startDate: undefined, endDate: undefined }
    }
    
    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    }
  }, [filtroData])

  // Hook de logs
  const { 
    logs, 
    pagination, 
    isLoading, 
    error, 
    mutate 
  } = useIntegrationLogs({
    status: filtroStatus !== "all" ? (filtroStatus as IntegrationActivityStatus) : undefined,
    startDate,
    endDate,
    limit: 50,
  })

  // Hook de estatísticas
  const { stats: stats24h, isLoading: isLoadingStats } = useIntegrationLogsStats("24h")

  // Filtra logs por categoria e integração
  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      // Filtro por categoria (Meta vs Outras)
      if (filtroCategoria !== "all") {
        const logCategory = INTEGRATION_CATEGORIES[log.integrationType]
        if (logCategory !== filtroCategoria) return false
      }

      // Filtro por tipo de integração
      if (filtroIntegracao !== "all" && log.integrationType !== filtroIntegracao) {
        return false
      }

      // Filtro por busca (título, descrição, tipo de atividade)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchSearch = 
          log.title?.toLowerCase().includes(search) ||
          log.description?.toLowerCase().includes(search) ||
          ACTIVITY_TYPE_LABELS[log.activityType]?.toLowerCase().includes(search) ||
          INTEGRATION_TYPE_LABELS[log.integrationType]?.toLowerCase().includes(search)
        if (!matchSearch) return false
      }

      return true
    })
  }, [logs, filtroCategoria, filtroIntegracao, searchTerm])

  // Calcula estatísticas
  const estatisticas = useMemo(() => {
    const total = logsFiltrados.length
    const success = logsFiltrados.filter(l => l.status === "SUCCESS").length
    const failed = logsFiltrados.filter(l => l.status === "FAILED").length
    const warning = logsFiltrados.filter(l => l.status === "WARNING").length
    const last24h = logsFiltrados.filter(l => {
      const logDate = new Date(l.createdAt)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return logDate >= yesterday
    }).length

    return { total, success, failed, warning, last24h }
  }, [logsFiltrados])

  // Formata data/hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      full: date.toLocaleString("pt-BR")
    }
  }

  // Obtém tipos de integração únicos baseado na categoria selecionada
  const tiposIntegracaoDisponiveis = useMemo(() => {
    const tipos = new Set<IntegrationType>()
    logs.forEach(log => {
      if (filtroCategoria === "all" || INTEGRATION_CATEGORIES[log.integrationType] === filtroCategoria) {
        tipos.add(log.integrationType)
      }
    })
    return ["all", ...Array.from(tipos).sort()]
  }, [logs, filtroCategoria])

  // Handlers
  const handleRefresh = () => {
    mutate()
  }

  // Loading state
  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-0">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar logs</h3>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Logs</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as atividades das integrações
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 border-0 shadow-sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Logs</p>
            <p className={`text-3xl font-bold ${STAT_COLORS.total}`}>
              {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : estatisticas.total}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sucessos</p>
            <p className={`text-3xl font-bold ${STAT_COLORS.success}`}>
              {estatisticas.success}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Erros</p>
            <p className={`text-3xl font-bold ${STAT_COLORS.error}`}>
              {estatisticas.failed}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
            <p className={`text-3xl font-bold ${STAT_COLORS.total}`}>
              {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : (stats24h?.totalCount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Categoria - Destaque especial */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <Layers className="h-5 w-5 text-[#46347F]" />
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Categoria de Integração
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={filtroCategoria === cat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setFiltroCategoria(cat.value)
                        setFiltroIntegracao("all") // Reset integração ao mudar categoria
                      }}
                      className={filtroCategoria === cat.value ? "bg-[#46347F]" : ""}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtros adicionais */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar logs por título, descrição ou evento..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filtroIntegracao} onValueChange={setFiltroIntegracao}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Integração" />
                </SelectTrigger>
                <SelectContent>
                  {tiposIntegracaoDisponiveis.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo === "all" ? "Todas as Integrações" : INTEGRATION_TYPE_LABELS[tipo as IntegrationType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40">
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="FAILED">Falhou</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroData} onValueChange={setFiltroData}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#46347F]" />
            Registro de Atividades
            {logsFiltrados.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {logsFiltrados.length} resultado{logsFiltrados.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Horário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Integração</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Detalhes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => {
                  const StatusIcon = STATUS_ICONS[log.status]
                  const IntegrationIcon = INTEGRATION_ICONS[log.integrationType] || Layers
                  const dateTime = formatDateTime(log.createdAt)
                  const isMetaApi = INTEGRATION_CATEGORIES[log.integrationType] === "meta"
                  
                  return (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{dateTime.time}</span>
                          <span className="text-xs text-muted-foreground">{dateTime.date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${isMetaApi ? "bg-blue-100" : "bg-purple-100"}`}>
                            <IntegrationIcon className={`h-4 w-4 ${isMetaApi ? "text-blue-600" : "text-[#46347F]"}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {INTEGRATION_TYPE_LABELS[log.integrationType]}
                            </span>
                            {isMetaApi && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-200 text-blue-600">
                                Meta API
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.activityType}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ACTIVITY_TYPE_LABELS[log.activityType] || log.activityType}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{log.title}</p>
                        {log.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]">
                            {log.description}
                          </p>
                        )}
                        {log.errorMessage && (
                          <p className="text-xs text-red-500 line-clamp-1 mt-1">
                            {log.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant="outline" 
                          className={`inline-flex items-center gap-1.5 ${STATUS_BADGE_STYLES[log.status]}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {STATUS_LABELS[log.status]}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {logsFiltrados.length === 0 && (
            <div className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-muted">
                  <Inbox className="h-12 w-12 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                {logs.length === 0 
                  ? "Não há registros de atividades das integrações. Os logs aparecerão aqui quando houver eventos como envio de mensagens, webhooks ou sincronizações."
                  : "Nenhum log corresponde aos filtros selecionados. Tente ajustar os critérios de busca."
                }
              </p>
              {logs.length === 0 && (
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensagens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Webhook className="h-4 w-4" />
                    <span>Webhooks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    <span>Sincronizações</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {logs.length} de {pagination.total} logs
              </p>
              {pagination.hasMore && (
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Carregar mais
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
