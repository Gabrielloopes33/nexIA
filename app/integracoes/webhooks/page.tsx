"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Pause,
  MoreHorizontal,
  Trash2,
  Edit,
  Link2,
  Clock,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Webhook {
  id: string
  url: string
  nome: string
  integracao: string
  eventos: string[]
  status: "ativo" | "pausado" | "erro"
  ultimoDisparo: string
  codigoResposta?: number
}

const webhooks: Webhook[] = [
  { 
    id: "wh_001", 
    url: "https://meusite.com/webhook/wpp", 
    nome: "Webhook Principal",
    integracao: "WhatsApp",
    eventos: ["mensagem_recebida", "mensagem_enviada"],
    status: "ativo", 
    ultimoDisparo: "há 2 minutos",
    codigoResposta: 200
  },
  { 
    id: "wh_002", 
    url: "https://n8n.io/webhook/crm", 
    nome: "CRM Bitrix",
    integracao: "Hotmart",
    eventos: ["lead_criado", "venda_concluida"],
    status: "erro", 
    ultimoDisparo: "há 5 horas",
    codigoResposta: 500
  },
  { 
    id: "wh_003", 
    url: "https://zapier.com/hooks/catch/123", 
    nome: "Zapier Flow",
    integracao: "Instagram",
    eventos: ["novo_comentario"],
    status: "pausado", 
    ultimoDisparo: "há 3 dias"
  },
  { 
    id: "wh_004", 
    url: "https://make.com/webhook/abc", 
    nome: "Make Automation",
    integracao: "WhatsApp",
    eventos: ["status_conexao"],
    status: "ativo", 
    ultimoDisparo: "há 15 minutos",
    codigoResposta: 200
  },
]

const statusConfig = {
  ativo: { label: "Ativo", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
  pausado: { label: "Pausado", icon: Pause, color: "bg-gray-100 text-gray-700 border-gray-200" },
  erro: { label: "Erro", icon: AlertTriangle, color: "bg-red-100 text-red-700 border-red-200" },
}

export default function WebhooksPage() {
  const [webhooksState, setWebhooksState] = useState(webhooks)

  const toggleStatus = (id: string) => {
    setWebhooksState(prev => prev.map(wh => 
      wh.id === id ? { 
        ...wh, 
        status: wh.status === "ativo" ? "pausado" : "ativo" 
      } : wh
    ))
  }

  const stats = {
    ativos: webhooksState.filter(w => w.status === "ativo").length,
    erros: webhooksState.filter(w => w.status === "erro").length,
    pausados: webhooksState.filter(w => w.status === "pausado").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie endpoints para receber eventos em tempo real
          </p>
        </div>
        <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
          <Plus className="h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Com Erro</p>
            <p className="text-3xl font-bold text-red-600">{stats.erros}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pausados</p>
            <p className="text-3xl font-bold text-gray-500">{stats.pausados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Webhooks */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#9795e4]" />
            Webhooks Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {webhooksState.map((webhook) => {
              const status = statusConfig[webhook.status]
              const StatusIcon = status.icon
              return (
                <div key={webhook.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#9795e4]/10 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-[#9795e4]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{webhook.nome}</p>
                          <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </div>
                        </div>
                        <code className="text-xs text-muted-foreground block mt-1 truncate">
                          {webhook.url}
                        </code>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {webhook.integracao}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Último: {webhook.ultimoDisparo}
                          </span>
                          {webhook.codigoResposta && (
                            <>
                              <span>•</span>
                              <Badge variant={webhook.codigoResposta === 200 ? "default" : "destructive"} className="text-xs">
                                HTTP {webhook.codigoResposta}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {webhook.eventos.map((evento) => (
                            <Badge key={evento} variant="outline" className="text-xs">
                              {evento}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={webhook.status === "ativo"}
                        onCheckedChange={() => toggleStatus(webhook.id)}
                      />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
