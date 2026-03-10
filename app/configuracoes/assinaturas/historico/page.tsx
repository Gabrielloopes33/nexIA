"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  Calendar,
  Filter,
  Receipt,
  RotateCcw,
  CreditCard,
  Package
} from "lucide-react"

interface Transacao {
  id: string
  data: string
  hora: string
  cliente: string
  tipo: "pagamento" | "reembolso" | "falha" | "cancelamento"
  descricao: string
  valor: string
  metodo: string
  status: "concluido" | "falhou" | "processando"
}

const transacoes: Transacao[] = [
  { id: "txn_001", data: "04/03/2026", hora: "14:32", cliente: "Acme Corp", tipo: "pagamento", descricao: "Assinatura Enterprise - Mar/2026", valor: "R$ 499,00", metodo: "Cartão Visa •••• 4242", status: "concluido" },
  { id: "txn_002", data: "04/03/2026", hora: "11:15", cliente: "TechStart Ltda", tipo: "pagamento", descricao: "Assinatura Pro - Mar/2026", valor: "R$ 199,00", metodo: "Boleto", status: "concluido" },
  { id: "txn_003", data: "04/03/2026", hora: "09:20", cliente: "Marketing Plus", tipo: "pagamento", descricao: "Assinatura Starter - Mar/2026", valor: "R$ 99,00", metodo: "Pix", status: "concluido" },
  { id: "txn_004", data: "03/03/2026", hora: "16:45", cliente: "Consulting Pro", tipo: "reembolso", descricao: "Reembolso parcial - Fev/2026", valor: "-R$ 150,00", metodo: "Cartão Mastercard •••• 8888", status: "concluido" },
  { id: "txn_005", data: "03/03/2026", hora: "10:30", cliente: "StartupXYZ", tipo: "falha", descricao: "Tentativa de pagamento - Cartão recusado", valor: "R$ 99,00", metodo: "Cartão Visa •••• 1234", status: "falhou" },
  { id: "txn_006", data: "02/03/2026", hora: "18:22", cliente: "Enterprise Ltda", tipo: "pagamento", descricao: "Assinatura Business - Mar/2026", valor: "R$ 299,00", metodo: "Cartão Amex •••• 1001", status: "concluido" },
  { id: "txn_007", data: "02/03/2026", hora: "14:10", cliente: "DevStudio", tipo: "cancelamento", descricao: "Cancelamento de assinatura Pro", valor: "R$ 0,00", metodo: "-", status: "concluido" },
  { id: "txn_008", data: "01/03/2026", hora: "09:00", cliente: "Global Solutions", tipo: "pagamento", descricao: "Assinatura Enterprise - Mar/2026", valor: "R$ 799,00", metodo: "Cartão Visa •••• 5555", status: "concluido" },
]

const tipoConfig = {
  pagamento: { label: "Pagamento", icon: ArrowUpRight, color: "text-green-600 bg-green-100" },
  reembolso: { label: "Reembolso", icon: RotateCcw, color: "text-amber-600 bg-amber-100" },
  falha: { label: "Falha", icon: ArrowDownRight, color: "text-red-600 bg-red-100" },
  cancelamento: { label: "Cancelamento", icon: Receipt, color: "text-gray-600 bg-gray-100" },
}

export default function HistoricoPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const transacoesFiltradas = transacoes.filter((t) =>
    t.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalTransacoes: transacoes.length,
    totalEntradas: "R$ 1.895,00",
    totalSaidas: "R$ 150,00",
    saldo: "R$ 1.745,00"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Transações</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as transações financeiras da plataforma
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transações</p>
            <p className="text-3xl font-bold">{stats.totalTransacoes}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalEntradas}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalSaidas}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-2xl font-bold text-[#46347F]">{stats.saldo}</p>
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
                placeholder="Buscar transações..."
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
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#46347F]" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {transacoesFiltradas.map((t) => {
              const tipo = tipoConfig[t.tipo]
              const Icon = tipo.icon
              return (
                <div key={t.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tipo.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{t.descricao}</p>
                      <span className={`font-semibold text-sm ${t.valor.startsWith('-') ? 'text-red-600' : t.valor !== 'R$ 0,00' ? 'text-green-600' : ''}`}>
                        {t.valor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{t.cliente}</span>
                      <span>•</span>
                      <span>{t.data} às {t.hora}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {t.metodo}
                      </Badge>
                      <Badge variant={t.status === "concluido" ? "default" : t.status === "falhou" ? "destructive" : "secondary"} className="text-xs">
                        {t.status === "concluido" ? "Concluído" : t.status === "falhou" ? "Falhou" : "Processando"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {transacoesFiltradas.length === 0 && (
            <div className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
