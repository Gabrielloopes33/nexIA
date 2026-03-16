"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Download, 
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Clock
} from "lucide-react"
import type { ActivityLog } from "@/lib/types/integration"

const statusConfig = {
  success: { label: "Sucesso", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  error: { label: "Erro", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
  warning: { label: "Alerta", icon: AlertTriangle, color: "bg-amber-100 text-amber-700 border-amber-200" },
}

export default function LogsPage() {
  const [logs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroIntegracao, setFiltroIntegracao] = useState("Todas")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const logsFiltrados = logs.filter((log) => {
    const matchSearch = 
      log.integrationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchIntegracao = filtroIntegracao === "Todas" || log.integrationName === filtroIntegracao
    const matchStatus = filtroStatus === "Todos" || statusConfig[log.status]?.label === filtroStatus
    return matchSearch && matchIntegracao && matchStatus
  })

  const integracoesUnicas = ["Todas", ...Array.from(new Set(logs.map(l => l.integrationName)))]
  const statusOptions = ["Todos", "Sucesso", "Erro", "Alerta"]

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
        <Button variant="outline" className="gap-2 border-0 shadow-sm">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Logs</p>
            <p className="text-3xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sucessos</p>
            <p className="text-3xl font-bold text-green-600">
              {logs.filter(l => l.status === 'success').length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Erros</p>
            <p className="text-3xl font-bold text-red-600">
              {logs.filter(l => l.status === 'error').length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Última 24h</p>
            <p className="text-3xl font-bold text-[#46347F]">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filtroIntegracao}
              onChange={(e) => setFiltroIntegracao(e.target.value)}
            >
              {integracoesUnicas.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="outline" className="gap-2 border-0 shadow-sm">
              <Calendar className="h-4 w-4" />
              Período
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#46347F]" />
            Registro de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Integração</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mensagem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => {
                  const status = statusConfig[log.status]
                  const StatusIcon = status?.icon || Activity
                  return (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {log.timestamp.toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{log.integrationName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.event}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{log.details}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status?.color || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status?.label || log.status}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {logsFiltrados.length === 0 && (
            <div className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
