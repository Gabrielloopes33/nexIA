"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Search, 
  Plus, 
  Zap,
  Percent,
  Calendar,
  Copy,
  MoreHorizontal,
  Tag,
  TrendingUp,
  Users,
  Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Cupom {
  id: string
  codigo: string
  tipo: "percentual" | "valor_fixo"
  valor: string
  descricao: string
  usos: number
  limite: number
  validade: string
  status: "ativo" | "inativo" | "expirado"
}

const cupons: Cupom[] = [
  { id: "coup_001", codigo: "BEMVINDO20", tipo: "percentual", valor: "20%", descricao: "Desconto para novos clientes", usos: 45, limite: 100, validade: "31/12/2026", status: "ativo" },
  { id: "coup_002", codigo: "BLACK50", tipo: "percentual", valor: "50%", descricao: "Black Friday 2025", usos: 128, limite: 200, validade: "30/11/2025", status: "inativo" },
  { id: "coup_003", codigo: "PRIMEIROMES", tipo: "valor_fixo", valor: "R$ 50,00", descricao: "Desconto no primeiro mês", usos: 89, limite: 500, validade: "31/12/2026", status: "ativo" },
  { id: "coup_004", codigo: "ANUAL10", tipo: "percentual", valor: "10%", descricao: "Desconto em planos anuais", usos: 12, limite: 50, validade: "30/06/2026", status: "ativo" },
  { id: "coup_005", codigo: "PARCEIRO30", tipo: "percentual", valor: "30%", descricao: "Cupom para parceiros", usos: 8, limite: 20, validade: "15/03/2025", status: "expirado" },
]

const statusConfig = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-700 border-green-200" },
  inativo: { label: "Inativo", color: "bg-gray-100 text-gray-700 border-gray-200" },
  expirado: { label: "Expirado", color: "bg-red-100 text-red-700 border-red-200" },
}

export default function CuponsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cuponsState, setCuponsState] = useState(cupons)

  const cuponsFiltrados = cuponsState.filter((c) =>
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStatus = (id: string) => {
    setCuponsState(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === "ativo" ? "inativo" : "ativo" } : c
    ))
  }

  const stats = {
    total: cupons.length,
    ativos: cupons.filter(c => c.status === "ativo").length,
    usosTotal: cupons.reduce((acc, c) => acc + c.usos, 0),
    economiaTotal: "R$ 12.450,00"
  }

  const copyToClipboard = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cupons de Desconto</h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie cupons promocionais
          </p>
        </div>
        <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
          <Plus className="h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Cupons</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Usos</p>
            <p className="text-3xl font-bold text-[#9795e4]">{stats.usosTotal}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Economia Gerada</p>
            <p className="text-2xl font-bold text-green-600">{stats.economiaTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cupons..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cuponsFiltrados.map((cupom) => {
          const status = statusConfig[cupom.status]
          return (
            <Card key={cupom.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-[#9795e4]/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-[#9795e4]" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-lg">{cupom.codigo}</p>
                      <p className="text-xs text-muted-foreground">{cupom.descricao}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-center py-4 bg-muted/30 rounded-lg mb-4">
                  <span className="text-3xl font-bold text-[#9795e4]">{cupom.valor}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {cupom.tipo === "percentual" ? "OFF" : "de desconto"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold">{cupom.usos}</p>
                    <p className="text-xs text-muted-foreground">Usos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{cupom.limite}</p>
                    <p className="text-xs text-muted-foreground">Limite</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="h-3.5 w-3.5" />
                  Válido até: {cupom.validade}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs gap-1"
                    onClick={() => copyToClipboard(cupom.codigo)}
                  >
                    <Copy className="h-3 w-3" />
                    Copiar
                  </Button>
                  {cupom.status !== "expirado" && (
                    <Switch 
                      checked={cupom.status === "ativo"}
                      onCheckedChange={() => toggleStatus(cupom.id)}
                    />
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {cuponsFiltrados.length === 0 && (
        <div className="py-12 text-center">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum cupom encontrado</p>
        </div>
      )}
    </div>
  )
}
