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
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Package,
  Calendar,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Assinatura {
  id: string
  cliente: string
  email: string
  plano: string
  valor: string
  status: "ativa" | "pendente" | "cancelada" | "pausada"
  proximoPagamento: string
  inicio: string
}

const assinaturas: Assinatura[] = [
  { id: "sub_001", cliente: "Acme Corp", email: "financeiro@acme.com", plano: "Enterprise", valor: "R$ 499,00", status: "ativa", proximoPagamento: "15/03/2026", inicio: "15/01/2025" },
  { id: "sub_002", cliente: "TechStart Ltda", email: "contato@techstart.com", plano: "Pro", valor: "R$ 199,00", status: "ativa", proximoPagamento: "18/03/2026", inicio: "18/06/2025" },
  { id: "sub_003", cliente: "Consulting Pro", email: "admin@consulting.pro", plano: "Business", valor: "R$ 299,00", status: "pendente", proximoPagamento: "20/03/2026", inicio: "20/03/2026" },
  { id: "sub_004", cliente: "DevStudio", email: "hello@devstudio.io", plano: "Pro", valor: "R$ 199,00", status: "cancelada", proximoPagamento: "-", inicio: "10/03/2024" },
  { id: "sub_005", cliente: "Marketing Plus", email: "team@marketing.plus", plano: "Starter", valor: "R$ 99,00", status: "ativa", proximoPagamento: "22/03/2026", inicio: "22/09/2025" },
  { id: "sub_006", cliente: "Global Solutions", email: "billing@globalsolutions.com", plano: "Enterprise", valor: "R$ 799,00", status: "ativa", proximoPagamento: "25/03/2026", inicio: "25/12/2024" },
  { id: "sub_007", cliente: "StartupXYZ", email: "founders@startupxyz.com", plano: "Starter", valor: "R$ 99,00", status: "pausada", proximoPagamento: "01/04/2026", inicio: "15/08/2025" },
  { id: "sub_008", cliente: "Enterprise Ltda", email: "pagamentos@enterprise.com", plano: "Business", valor: "R$ 299,00", status: "ativa", proximoPagamento: "28/03/2026", inicio: "28/02/2025" },
]

const statusConfig = {
  ativa: { label: "Ativa", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  pendente: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  cancelada: { label: "Cancelada", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
  pausada: { label: "Pausada", icon: Pause, color: "bg-gray-100 text-gray-700 border-gray-200" },
}

const planos = ["Todos", "Starter", "Pro", "Business", "Enterprise"]
const statusOptions = ["Todos", "Ativa", "Pendente", "Cancelada", "Pausada"]

export default function AssinaturasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPlano, setFiltroPlano] = useState("Todos")
  const [filtroStatus, setFiltroStatus] = useState("Todos")

  const assinaturasFiltradas = assinaturas.filter((sub) => {
    const matchSearch = 
      sub.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchPlano = filtroPlano === "Todos" || sub.plano === filtroPlano
    const matchStatus = filtroStatus === "Todos" || statusConfig[sub.status].label === filtroStatus
    return matchSearch && matchPlano && matchStatus
  })

  const stats = {
    total: assinaturas.length,
    ativas: assinaturas.filter(s => s.status === "ativa").length,
    pendentes: assinaturas.filter(s => s.status === "pendente").length,
    canceladas: assinaturas.filter(s => s.status === "cancelada").length,
    mrr: "R$ 45.892,00"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as assinaturas dos seus clientes
          </p>
        </div>
        <Link href="/cobrancas/nova">
          <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
            <Plus className="h-4 w-4" />
            Nova Assinatura
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativas</p>
            <p className="text-3xl font-bold text-green-600">{stats.ativas}</p>
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
            <p className="text-xs text-muted-foreground">Canceladas</p>
            <p className="text-3xl font-bold text-red-600">{stats.canceladas}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm col-span-2 md:col-span-4 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="text-2xl font-bold text-[#9795e4]">{stats.mrr}</p>
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
            <Select value={filtroPlano} onValueChange={setFiltroPlano}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                {planos.map((plano) => (
                  <SelectItem key={plano} value={plano}>{plano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Package className="h-4 w-4 text-[#9795e4]" />
            Lista de Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Próximo Pag.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Início</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {assinaturasFiltradas.map((sub) => {
                  const status = statusConfig[sub.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={sub.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{sub.cliente}</p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-medium">
                          {sub.plano}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">{sub.valor}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
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
                          {sub.proximoPagamento}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{sub.inicio}</td>
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
          {assinaturasFiltradas.length === 0 && (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
