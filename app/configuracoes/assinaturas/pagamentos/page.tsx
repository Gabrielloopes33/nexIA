"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CreditCard, Plus, Wallet, QrCode, Landmark, Smartphone, CheckCircle2, AlertCircle, MoreHorizontal } from "lucide-react"

interface MetodoPagamento {
  id: string
  nome: string
  tipo: "cartao" | "boleto" | "pix" | "wallet"
  status: "ativo" | "inativo"
  taxa: string
  processador: string
  ultimaTransacao?: string
  icon: React.ElementType
}

const metodos: MetodoPagamento[] = [
  { id: "pay_001", nome: "Cartão de Crédito", tipo: "cartao", status: "ativo", taxa: "2,99%", processador: "Stripe", ultimaTransacao: "Hoje, 14:32", icon: CreditCard },
  { id: "pay_002", nome: "Cartão de Débito", tipo: "cartao", status: "ativo", taxa: "1,99%", processador: "Stripe", ultimaTransacao: "Hoje, 11:15", icon: CreditCard },
  { id: "pay_003", nome: "Boleto Bancário", tipo: "boleto", status: "ativo", taxa: "R$ 2,50", processador: "Stripe", ultimaTransacao: "Ontem, 16:45", icon: Landmark },
  { id: "pay_004", nome: "Pix", tipo: "pix", status: "ativo", taxa: "0,99%", processador: "Stripe", ultimaTransacao: "Hoje, 09:20", icon: QrCode },
  { id: "pay_005", nome: "Apple Pay", tipo: "wallet", status: "ativo", taxa: "2,99%", processador: "Stripe", ultimaTransacao: "2 dias atrás", icon: Smartphone },
  { id: "pay_006", nome: "Google Pay", tipo: "wallet", status: "inativo", taxa: "2,99%", processador: "Stripe", icon: Wallet },
]

export default function PagamentosPage() {
  const [metodosState, setMetodosState] = useState(metodos)

  const toggleStatus = (id: string) => {
    setMetodosState(prev => prev.map(m => 
      m.id === id ? { ...m, status: m.status === "ativo" ? "inativo" : "ativo" } : m
    ))
  }

  const ativos = metodosState.filter(m => m.status === "ativo").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métodos de Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Configure os métodos de pagamento aceitos na sua plataforma
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Plus className="h-4 w-4" />
          Adicionar Método
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Métodos Ativos</p>
            <p className="text-3xl font-bold text-green-600">{ativos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Processador Principal</p>
            <p className="text-2xl font-bold text-[#46347F]">Stripe</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Moeda Padrão</p>
            <p className="text-2xl font-bold">BRL (R$)</p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Status */}
      <Card className="shadow-sm border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Stripe Conectado</p>
                <p className="text-sm text-muted-foreground">Sua conta Stripe está configurada e recebendo pagamentos</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-0 shadow-sm">
              Configurar Stripe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pagamento */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#46347F]" />
            Métodos Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {metodosState.map((metodo) => {
              const Icon = metodo.icon
              return (
                <div key={metodo.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#46347F]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{metodo.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Taxa: {metodo.taxa}</span>
                        <span>•</span>
                        <span>{metodo.processador}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {metodo.ultimaTransacao && (
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        Última: {metodo.ultimaTransacao}
                      </span>
                    )}
                    <Switch 
                      checked={metodo.status === "ativo"}
                      onCheckedChange={() => toggleStatus(metodo.id)}
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerta */}
      <Card className="shadow-sm border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Configuração de Webhooks</p>
              <p className="text-sm text-muted-foreground">
                Certifique-se de configurar os webhooks do Stripe para receber notificações de pagamentos, 
                reembolsos e cancelamentos automaticamente.
              </p>
              <code className="mt-2 block text-xs bg-background px-2 py-1 rounded border">
                POST https://seusite.com/api/stripe/webhook
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
