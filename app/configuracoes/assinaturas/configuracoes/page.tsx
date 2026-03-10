"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save,
  Settings,
  Bell,
  Mail,
  CreditCard,
  Shield,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Link as LinkIcon
} from "lucide-react"

export default function ConfiguracoesPage() {
  const [emailPagamento, setEmailPagamento] = useState(true)
  const [emailAtraso, setEmailAtraso] = useState(true)
  const [emailCancelamento, setEmailCancelamento] = useState(true)
  const [cobrancaAutomatica, setCobrancaAutomatica] = useState(true)
  const [retryAutomatico, setRetryAutomatico] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Configure as preferências do módulo de assinaturas
          </p>
        </div>
        <Button className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
          <TabsTrigger value="integracao">Integração</TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="geral" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#46347F]" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Moeda Padrão</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="BRL">BRL - Real Brasileiro (R$)</option>
                    <option value="USD">USD - Dólar Americano ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Formato de Data</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Período de Teste (dias)</label>
                  <Input type="number" defaultValue="14" />
                  <p className="text-xs text-muted-foreground mt-1">Dias gratuitos para novas assinaturas</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Dias para Cancelamento</label>
                  <Input type="number" defaultValue="7" />
                  <p className="text-xs text-muted-foreground mt-1">Prazo para reembolso integral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#46347F]" />
                URLs de Redirecionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">URL de Sucesso</label>
                <Input defaultValue="https://app.nexia.com/pagamento/sucesso" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">URL de Cancelamento</label>
                <Input defaultValue="https://app.nexia.com/pagamento/cancelado" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">URL de Erro</label>
                <Input defaultValue="https://app.nexia.com/pagamento/erro" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#46347F]" />
                Email aos Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Confirmação de Pagamento</p>
                    <p className="text-xs text-muted-foreground">Enviar email quando um pagamento for confirmado</p>
                  </div>
                </div>
                <Switch checked={emailPagamento} onCheckedChange={setEmailPagamento} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Aviso de Atraso</p>
                    <p className="text-xs text-muted-foreground">Notificar clientes sobre faturas em atraso</p>
                  </div>
                </div>
                <Switch checked={emailAtraso} onCheckedChange={setEmailAtraso} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Cancelamento</p>
                    <p className="text-xs text-muted-foreground">Confirmar cancelamentos por email</p>
                  </div>
                </div>
                <Switch checked={emailCancelamento} onCheckedChange={setEmailCancelamento} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Cobrança */}
        <TabsContent value="cobrança" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#46347F]" />
                Configurações de Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Cobrança Automática</p>
                  <p className="text-xs text-muted-foreground">Cobrar automaticamente no vencimento</p>
                </div>
                <Switch checked={cobrancaAutomatica} onCheckedChange={setCobrancaAutomatica} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Tentativas Automáticas</p>
                  <p className="text-xs text-muted-foreground">Tentar cobrança novamente em caso de falha</p>
                </div>
                <Switch checked={retryAutomatico} onCheckedChange={setRetryAutomatico} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tentativas de Cobrança</label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Intervalo entre Tentativas (dias)</label>
                  <Input type="number" defaultValue="3" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dias de Tolerância</label>
                <Input type="number" defaultValue="3" />
                <p className="text-xs text-muted-foreground mt-1">Dias após vencimento antes de suspender o serviço</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Integração */}
        <TabsContent value="integracao" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#46347F]" />
                Integração Stripe
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Conectado ao Stripe</p>
                    <p className="text-sm text-muted-foreground">Conta: acct_1xxxxxxxxxxxxxx</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Webhook Secret</label>
                <Input type="password" value="whsec_xxxxxxxxxxxxxxxx" readOnly />
                <p className="text-xs text-muted-foreground mt-1">Chave secreta para validar webhooks do Stripe</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL do Webhook</label>
                <div className="flex gap-2">
                  <Input value="https://api.nexia.com/webhooks/stripe" readOnly />
                  <Button variant="outline" className="border-0 shadow-sm">Copiar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#46347F]" />
                Chaves de API
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Chave Pública (Publishable)</label>
                <Input value="pk_live_xxxxxxxxxxxxxxxx" readOnly />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Chave Secreta</label>
                <Input type="password" value="sk_live_xxxxxxxxxxxxxxxx" readOnly />
              </div>
              <Button variant="outline" className="w-full border-0 shadow-sm">Gerar Novas Chaves</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
