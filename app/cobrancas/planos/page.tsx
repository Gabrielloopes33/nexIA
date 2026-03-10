"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Package,
  Check,
  Users,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react"

interface Plano {
  id: string
  nome: string
  descricao: string
  preco: string
  periodicidade: "mensal" | "anual"
  recursos: string[]
  clientes: number
  status: "ativo" | "inativo"
  popular?: boolean
}

const planos: Plano[] = [
  {
    id: "plan_001",
    nome: "Starter",
    descricao: "Perfeito para começar",
    preco: "R$ 99,00",
    periodicidade: "mensal",
    recursos: ["Até 5 usuários", "1.000 contatos", "Suporte por email", "Relatórios básicos"],
    clientes: 145,
    status: "ativo"
  },
  {
    id: "plan_002",
    nome: "Pro",
    descricao: "Para equipes em crescimento",
    preco: "R$ 199,00",
    periodicidade: "mensal",
    recursos: ["Até 20 usuários", "10.000 contatos", "Suporte prioritário", "Relatórios avançados", "Automações", "API access"],
    clientes: 128,
    status: "ativo",
    popular: true
  },
  {
    id: "plan_003",
    nome: "Business",
    descricao: "Para empresas estabelecidas",
    preco: "R$ 299,00",
    periodicidade: "mensal",
    recursos: ["Usuários ilimitados", "50.000 contatos", "Suporte 24/7", "Relatórios customizados", "Automações avançadas", "API dedicada", "White-label"],
    clientes: 45,
    status: "ativo"
  },
  {
    id: "plan_004",
    nome: "Enterprise",
    descricao: "Solução completa",
    preco: "R$ 499,00",
    periodicidade: "mensal",
    recursos: ["Tudo do Business", "Contatos ilimitados", "Gerente de conta dedicado", "SLA garantido", "On-premise option", "Treinamento incluso"],
    clientes: 24,
    status: "ativo"
  },
]

export default function PlanosPage() {
  const [planosState, setPlanosState] = useState(planos)

  const toggleStatus = (id: string) => {
    setPlanosState(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === "ativo" ? "inativo" : "ativo" } : p
    ))
  }

  const totalClientes = planos.reduce((acc, p) => acc + p.clientes, 0)
  const mrr = "R$ 68.234,00"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos e Preços</h1>
          <p className="text-sm text-muted-foreground">
            Configure os planos disponíveis para seus clientes
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de Planos</p>
            <p className="text-3xl font-bold">{planos.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clientes Totais</p>
            <p className="text-3xl font-bold text-[#46347F]">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MRR Total</p>
            <p className="text-2xl font-bold text-green-600">{mrr}</p>
          </CardContent>
        </Card>
      </div>

      {/* Planos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {planosState.map((plano) => (
          <Card 
            key={plano.id} 
            className={`shadow-sm hover:shadow-md transition-shadow ${plano.popular ? 'ring-2 ring-[#46347F]' : ''}`}
          >
            {plano.popular && (
              <div className="bg-[#46347F] text-white text-xs font-medium text-center py-1">
                Mais Popular
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{plano.nome}</h3>
                  <p className="text-xs text-muted-foreground">{plano.descricao}</p>
                </div>
                <Switch 
                  checked={plano.status === "ativo"}
                  onCheckedChange={() => toggleStatus(plano.id)}
                />
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">{plano.preco}</span>
                <span className="text-sm text-muted-foreground">/{plano.periodicidade}</span>
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{plano.clientes} clientes ativos</span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground">Recursos:</p>
                {plano.recursos.map((recurso, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-muted-foreground">{recurso}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1 border-0 shadow-sm">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Custom Plan Card */}
      <Card className="shadow-sm border-dashed border-2 border-muted">
        <CardContent className="p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-[#46347F]/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-6 w-6 text-[#46347F]" />
          </div>
          <h3 className="font-medium mb-2">Criar Novo Plano</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione um novo plano com recursos e preços personalizados
          </p>
          <Button className="bg-[#46347F] hover:bg-[#46347F]">
            Configurar Plano
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
