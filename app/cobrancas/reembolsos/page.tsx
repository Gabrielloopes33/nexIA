"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Wallet,
  Calendar,
  Filter,
  MoreHorizontal,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Reembolso {
  id: string
  data: string
  cliente: string
  fatura: string
  valor: string
  motivo: string
  status: "concluido" | "pendente" | "recusado"
  metodo: string
  processadoEm?: string
}

const reembolsos: Reembolso[] = [
  { id: "ref_001", data: "03/03/2026", cliente: "Consulting Pro", fatura: "inv_045", valor: "R$ 150,00", motivo: "Cobrança duplicada", status: "concluido", metodo: "Cartão •••• 8888", processadoEm: "03/03/2026" },
  { id: "ref_002", data: "02/03/2026", cliente: "TechStart Ltda", fatura: "inv_042", valor: "R$ 199,00", motivo: "Cancelamento dentro do prazo", status: "concluido", metodo: "Cartão •••• 4242", processadoEm: "02/03/2026" },
  { id: "ref_003", data: "01/03/2026", cliente: "StartupXYZ", fatura: "inv_038", valor: "R$ 99,00", motivo: "Insatisfação com o serviço", status: "pendente", metodo: "Cartão •••• 1234" },
  { id: "ref_004", data: "28/02/2026", cliente: "DevStudio", fatura: "inv_035", valor: "R$ 199,00", motivo: "Produto não entregue", status: "concluido", metodo: "Boleto", processadoEm: "01/03/2026" },
  { id: "ref_005", data: "25/02/2026", cliente: "Marketing Plus", fatura: "inv_030", valor: "R$ 50,00", motivo: "Desconto não aplicado", status: "recusado", metodo: "Pix" },
]

const statusConfig = {
  concluido: { label: "Concluído", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  pendente: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  recusado: { label: "Recusado", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
}

export default function ReembolsosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const reembolsosFiltrados = reembolsos.filter((r) =>
    r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: reembolsos.length,
    concluidos: reembolsos.filter(r => r.status === "concluido").length,
    pendentes: reembolsos.filter(r => r.status === "pendente").length,
    totalReembolsado: "R$ 598,00"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reembolsos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie solicitações de reembolso dos clientes
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <RotateCcw className="h-4 w-4" />
          Novo Reembolso
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Concluídos</p>
            <p className="text-3xl font-bold text-green-600">{stats.concluidos}</p>
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
            <p className="text-xs text-muted-foreground">Total Reembolsado</p>
            <p className="text-2xl font-bold text-[#46347F]">{stats.totalReembolsado}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar reembolsos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 border-0 shadow-sm">
              <Calendar className="h-4 w-4" />
              Período
            </Button>
            <Button variant="outline" className="gap-2 border-0 shadow-sm">
              <Filter className="h-4 w-4" />
              Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#46347F]" />
            Lista de Reembolsos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reembolsosFiltrados.map((ref) => {
                  const status = statusConfig[ref.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={ref.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{ref.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{ref.cliente}</p>
                          <p className="text-xs text-muted-foreground">Fatura: {ref.fatura}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-red-600">{ref.valor}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{ref.motivo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", status.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{ref.data}</p>
                          {ref.processadoEm && (
                            <p className="text-xs text-muted-foreground">Proc: {ref.processadoEm}</p>
                          )}
                        </div>
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
          {reembolsosFiltrados.length === 0 && (
            <div className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum reembolso encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
