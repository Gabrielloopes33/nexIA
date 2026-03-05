"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Save,
  Settings,
  Bell,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Unplug,
  Clock,
  Mail,
  Globe
} from "lucide-react"

export default function SettingsPage() {
  const [autoSync, setAutoSync] = useState(true)
  const [notifyErrors, setNotifyErrors] = useState(true)
  const [frequency, setFrequency] = useState("30")
  const [email, setEmail] = useState("admin@nexia.com")
  const [webhookUrl, setWebhookUrl] = useState("")

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Configure as preferências do módulo de integrações
          </p>
        </div>
        <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>

      {/* Geral */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#9795e4]" />
            Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sincronização Automática</p>
              <p className="text-sm text-muted-foreground">
                Sincronizar dados automaticamente em segundo plano
              </p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          {autoSync && (
            <div className="pl-4 border-l-2 border-[#9795e4]/30 space-y-2">
              <Label>Frequência de Sincronização</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="5">A cada 5 minutos</option>
                <option value="15">A cada 15 minutos</option>
                <option value="30">A cada 30 minutos</option>
                <option value="60">A cada 1 hora</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificar em caso de erro</p>
              <p className="text-sm text-muted-foreground">
                Receber alertas quando uma integração falhar
              </p>
            </div>
            <Switch checked={notifyErrors} onCheckedChange={setNotifyErrors} />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#9795e4]" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Email de Alertas</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="pl-10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook de Notificação (opcional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="pl-10"
                placeholder="https://seusite.com/webhook/notificacoes"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Receba notificações em um endpoint externo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="shadow-sm border-red-200">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desconectar Todas as Integrações</p>
              <p className="text-sm text-muted-foreground">
                Remove todas as conexões ativas (não pode ser desfeito)
              </p>
            </div>
            <Button variant="destructive" className="gap-2">
              <Unplug className="h-4 w-4" />
              Desconectar
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Limpar Histórico de Logs</p>
              <p className="text-sm text-muted-foreground">
                Apaga permanentemente todos os logs de atividade
              </p>
            </div>
            <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
