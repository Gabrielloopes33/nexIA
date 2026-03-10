"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Filter,
  Trash2,
  MessageSquare,
  Bot,
  AlertTriangle,
  Mail,
  Zap
} from "lucide-react"

interface Filtro {
  id: string
  nome: string
  descricao: string
  condicao: string
  acao: string
  status: "ativo" | "inativo"
  icone: React.ElementType
}

const filtros: Filtro[] = [
  { 
    id: "filt_001", 
    nome: "Ignorar mensagens de bots", 
    descricao: "Filtra mensagens automáticas de bots",
    condicao: "remetente contém 'bot'",
    acao: "ignorar evento",
    status: "ativo",
    icone: Bot
  },
  { 
    id: "filt_002", 
    nome: "Encaminhar erros críticos", 
    descricao: "Notifica sobre falhas importantes",
    condicao: "status = 'error' AND integração = WhatsApp",
    acao: "notificar webhook",
    status: "ativo",
    icone: AlertTriangle
  },
  { 
    id: "filt_003", 
    nome: "Priorizar mensagens VIP", 
    descricao: "Destaca mensagens de clientes importantes",
    condicao: "tag = 'vip' OR valor > R$1000",
    acao: "marcar como prioridade",
    status: "inativo",
    icone: Zap
  },
  { 
    id: "filt_004", 
    nome: "Auto-responder fora do horário", 
    descricao: "Responde automaticamente quando offline",
    condicao: "horario > 18:00 OR horario < 08:00",
    acao: "enviar mensagem automática",
    status: "ativo",
    icone: Mail
  },
]

export default function FiltersPage() {
  const [filtrosState, setFiltrosState] = useState(filtros)

  const toggleStatus = (id: string) => {
    setFiltrosState(prev => prev.map(f => 
      f.id === id ? { ...f, status: f.status === "ativo" ? "inativo" : "ativo" } : f
    ))
  }

  const ativos = filtrosState.filter(f => f.status === "ativo").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Filtros de Integração</h1>
          <p className="text-sm text-muted-foreground">
            Automatize o processamento de mensagens e eventos
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Novo Filtro
        </Button>
      </div>

      {/* Stats */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Total de Filtros</p>
              <p className="text-3xl font-bold">{filtrosState.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-3xl font-bold text-green-600">{ativos}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Inativos</p>
              <p className="text-3xl font-bold text-gray-500">{filtrosState.length - ativos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Filtros */}
      <div className="grid gap-4">
        {filtrosState.map((filtro) => {
          const Icon = filtro.icone
          return (
            <Card key={filtro.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#46347F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{filtro.nome}</p>
                        <Badge variant={filtro.status === "ativo" ? "default" : "secondary"} className={filtro.status === "ativo" ? "bg-green-100 text-green-700" : ""}>
                          {filtro.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{filtro.descricao}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xs font-medium text-muted-foreground uppercase">Se:</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{filtro.condicao}</code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xs font-medium text-muted-foreground uppercase">Então:</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{filtro.acao}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={filtro.status === "ativo"}
                      onCheckedChange={() => toggleStatus(filtro.id)}
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
