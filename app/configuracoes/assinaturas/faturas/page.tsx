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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useInvoices } from "@/hooks/use-invoices"

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function getDaysUntil(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const statusConfig = {
  paid: { label: "Paga", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  failed: { label: "Falhou", icon: AlertCircle, color: "bg-red-100 text-red-700 border-red-200" },
}

const statusOptions = ["Todos", "Paga", "Pendente", "Falhou"]

export default function FaturasPage() {
  const { invoices, isLoading, error, refetch, markAsPaid } = useInvoices()
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const faturasFiltradas = invoices.filter((inv) => {
    const planName = inv.subscription?.plan?.name || ''
    const matchSearch = 
      planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filtroStatus === "Todos" || statusConfig[inv.status as keyof typeof statusConfig]?.label === filtroStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: invoices.length,
    pagas: invoices.filter(f => f.status === "paid").length,
    pendentes: invoices.filter(f => f.status === "pending").length,
    falhas: invoices.filter(f => f.status === "failed").length,
    totalReceber: invoices
      .filter(f => f.status === "pending")
      .reduce((acc, inv) => acc + inv.amountCents, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          <p className="text-muted-foreground">Carregando faturas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Erro ao carregar faturas</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
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
          <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
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
            <p className="text-2xl font-bold text-[#46347F]">{formatCurrency(stats.totalReceber)}</p>
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
                placeholder="Buscar por plano ou ID..."
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
            <Receipt className="h-4 w-4 text-[#46347F]" />
            Lista de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fatura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pagamento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturasFiltradas.map((inv) => {
                  const status = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.pending
                  const StatusIcon = status.icon
                  const daysUntil = getDaysUntil(inv.dueDate)
                  return (
                    <tr key={inv.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{inv.id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{inv.subscription?.plan?.name || 'Plano'}</p>
                          <p className="text-xs text-muted-foreground">{inv.subscription?.plan?.interval === 'monthly' ? 'Mensal' : 'Anual'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">{formatCurrency(inv.amountCents)}</span>
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
                          <span className={cn(
                            daysUntil < 0 && inv.status === 'pending' && "text-red-600 font-medium"
                          )}>
                            {formatDate(inv.dueDate)}
                            {daysUntil < 0 && inv.status === 'pending' && ` (Atrasada ${Math.abs(daysUntil)} dias)`}
                            {daysUntil >= 0 && inv.status === 'pending' && ` (${daysUntil} dias)`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {inv.paidAt ? (
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{formatDate(inv.paidAt)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-green-600"
                              onClick={() => markAsPaid(inv.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Marcar Paga
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
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
