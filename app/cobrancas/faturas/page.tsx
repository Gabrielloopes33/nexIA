"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Download,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  Calendar,
  FileText,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Fatura {
  id: string
  cliente: string
  email: string
  valor: string
  status: "paga" | "pendente" | "atrasada" | "cancelada"
  dataEmissao: string
  dataVencimento: string
  dataPagamento?: string
  metodo?: string
}

const faturas: Fatura[] = [
  { id: "inv_001", cliente: "Acme Corp", email: "financeiro@acme.com", valor: "R$ 499,00", status: "paga", dataEmissao: "01/03/2026", dataVencimento: "10/03/2026", dataPagamento: "05/03/2026", metodo: "Cartão" },
  { id: "inv_002", cliente: "TechStart Ltda", email: "contato@techstart.com", valor: "R$ 199,00", status: "paga", dataEmissao: "01/03/2026", dataVencimento: "10/03/2026", dataPagamento: "08/03/2026", metodo: "Boleto" },
  { id: "inv_003", cliente: "Global Solutions", email: "billing@globalsolutions.com", valor: "R$ 799,00", status: "pendente", dataEmissao: "01/03/2026", dataVencimento: "15/03/2026" },
  { id: "inv_004", cliente: "StartupXYZ", email: "founders@startupxyz.com", valor: "R$ 149,00", status: "atrasada", dataEmissao: "01/02/2026", dataVencimento: "10/02/2026" },
  { id: "inv_005", cliente: "Enterprise Ltda", email: "pagamentos@enterprise.com", valor: "R$ 299,00", status: "paga", dataEmissao: "01/03/2026", dataVencimento: "10/03/2026", dataPagamento: "02/03/2026", metodo: "Pix" },
  { id: "inv_006", cliente: "Consulting Pro", email: "admin@consulting.pro", valor: "R$ 299,00", status: "cancelada", dataEmissao: "01/03/2026", dataVencimento: "10/03/2026" },
  { id: "inv_007", cliente: "DevStudio", email: "hello@devstudio.io", valor: "R$ 199,00", status: "pendente", dataEmissao: "05/03/2026", dataVencimento: "20/03/2026" },
  { id: "inv_008", cliente: "Marketing Plus", email: "team@marketing.plus", valor: "R$ 99,00", status: "paga", dataEmissao: "01/03/2026", dataVencimento: "10/03/2026", dataPagamento: "09/03/2026", metodo: "Cartão" },
]

const statusConfig = {
  paga: { label: "Paga", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  pendente: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  atrasada: { label: "Atrasada", icon: AlertCircle, color: "bg-red-100 text-red-700 border-red-200" },
  cancelada: { label: "Cancelada", icon: XCircle, color: "bg-gray-100 text-gray-700 border-gray-200" },
}

const statusOptions = ["Todos", "Paga", "Pendente", "Atrasada", "Cancelada"]

export default function FaturasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const faturasFiltradas = faturas.filter((inv) => {
    const matchSearch = 
      inv.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filtroStatus === "Todos" || statusConfig[inv.status].label === filtroStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: faturas.length,
    pagas: faturas.filter(f => f.status === "paga").length,
    pendentes: faturas.filter(f => f.status === "pendente").length,
    atrasadas: faturas.filter(f => f.status === "atrasada").length,
    totalReceber: "R$ 1.247,00"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie faturas e pagamentos dos clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-0 shadow-sm">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
            <Send className="h-4 w-4" />
            Enviar Fatura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Faturas</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pagas</p>
            <p className="text-3xl font-bold text-green-600">{stats.pagas}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-3xl font-bold text-amber-600">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">A Receber</p>
            <p className="text-2xl font-bold text-[#9795e4]">{stats.totalReceber}</p>
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
                placeholder="Buscar por cliente, email ou ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#9795e4]" />
            Lista de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fatura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pagamento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((inv) => {
                  const status = statusConfig[inv.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={inv.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{inv.id}</p>
                            <p className="text-xs text-muted-foreground">{inv.dataEmissao}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{inv.cliente}</p>
                          <p className="text-xs text-muted-foreground">{inv.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">{inv.valor}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", status.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {inv.dataVencimento}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {inv.dataPagamento ? (
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{inv.dataPagamento}</span>
                            <p className="text-xs text-muted-foreground">{inv.metodo}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {faturasFiltradas.length === 0 && (
            <div className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
