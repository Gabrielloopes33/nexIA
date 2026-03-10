"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Square,
  Smartphone,
  Instagram,
  ShoppingCart,
  Globe
} from "lucide-react"

interface SyncStatus {
  id: string
  nome: string
  icone: React.ElementType
  progresso: number
  status: "completo" | "em_andamento" | "nunca" | "erro"
  ultimaSync: string
  proximaSync: string
}

const syncData: SyncStatus[] = [
  { 
    id: "1", 
    nome: "WhatsApp Não Oficial", 
    icone: Smartphone,
    progresso: 100,
    status: "completo",
    ultimaSync: "há 5 minutos",
    proximaSync: "em 25 minutos"
  },
  { 
    id: "2", 
    nome: "Instagram", 
    icone: Instagram,
    progresso: 60,
    status: "em_andamento",
    ultimaSync: "há 1 hora",
    proximaSync: "em andamento..."
  },
  { 
    id: "3", 
    nome: "Hotmart", 
    icone: ShoppingCart,
    progresso: 0,
    status: "nunca",
    ultimaSync: "Nunca",
    proximaSync: "Aguardando..."
  },
  { 
    id: "4", 
    nome: "Webhook Externo", 
    icone: Globe,
    progresso: 0,
    status: "erro",
    ultimaSync: "há 2 dias",
    proximaSync: "Erro na conexão"
  },
]

export default function SyncPage() {
  const [syncState, setSyncState] = useState(syncData)

  const forcarSync = (id: string) => {
    setSyncState(prev => prev.map(s => 
      s.id === id ? { ...s, status: "em_andamento", progresso: 0 } : s
    ))
    // Simula progresso
    setTimeout(() => {
      setSyncState(prev => prev.map(s => 
        s.id === id ? { ...s, status: "completo", progresso: 100, ultimaSync: "agora" } : s
      ))
    }, 2000)
  }

  const cancelarSync = (id: string) => {
    setSyncState(prev => prev.map(s => 
      s.id === id ? { ...s, status: "erro", progresso: 0 } : s
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sincronização</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status de sincronização das integrações
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <RefreshCw className="h-4 w-4" />
          Sincronizar Tudo
        </Button>
      </div>

      {/* Status Global */}
      <Card className="shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#46347F]" />
              <div>
                <p className="font-medium">Última sincronização global</p>
                <p className="text-sm text-muted-foreground">há 5 minutos</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Tudo certo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sincronizações */}
      <div className="space-y-4">
        {syncState.map((item) => {
          const Icon = item.icone
          return (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#46347F]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Última: {item.ultimaSync}</span>
                        <span>•</span>
                        <span>Próxima: {item.proximaSync}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "completo" && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completo
                      </Badge>
                    )}
                    {item.status === "em_andamento" && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Em andamento
                      </Badge>
                    )}
                    {item.status === "nunca" && (
                      <Badge variant="outline">Nunca sincronizado</Badge>
                    )}
                    {item.status === "erro" && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{item.progresso}%</span>
                  </div>
                  <Progress value={item.progresso} className="h-2" />
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-2 mt-4">
                  {item.status === "em_andamento" ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-0 shadow-sm text-red-600"
                      onClick={() => cancelarSync(item.id)}
                    >
                      <Square className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 border-0 shadow-sm"
                      onClick={() => forcarSync(item.id)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {item.status === "nunca" ? "Iniciar" : "Forçar"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
