"use client"

import { useState } from "react"
import { Webhook, Save, TestTube, Loader2, Shield, Globe, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UpdateWebhookRequest, WebhookEventType } from "@/lib/whatsapp/types"
import { WEBHOOK_EVENTS } from "@/lib/whatsapp/constants"

interface WebhookConfigFormProps {
  config?: {
    url: string
    verifyToken: string
    events: WebhookEventType[]
    active: boolean
  }
  onSave: (config: UpdateWebhookRequest) => Promise<void>
  onTest: (url: string) => Promise<{ success: boolean; message: string }>
  isLoading?: boolean
}

export function WebhookConfigForm({ 
  config, 
  onSave, 
  onTest,
  isLoading = false 
}: WebhookConfigFormProps) {
  const [url, setUrl] = useState(config?.url || '')
  const [verifyToken, setVerifyToken] = useState(config?.verifyToken || '')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>(
    config?.events || ['messages']
  )
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleEventToggle = (event: WebhookEventType) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const handleTest = async () => {
    if (!url) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await onTest(url)
      setTestResult(result)
    } catch {
      setTestResult({ success: false, message: 'Erro ao testar webhook' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    await onSave({
      url,
      verifyToken,
      events: selectedEvents,
    })
  }

  const allSelected = selectedEvents.length === WEBHOOK_EVENTS.length

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(WEBHOOK_EVENTS.map(e => e.value))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9795e4]/10">
            <Webhook className="h-5 w-5 text-[#9795e4]" />
          </div>
          <div>
            <CardTitle>Configuração do Webhook</CardTitle>
            <CardDescription>
              Configure o endpoint para receber eventos do WhatsApp
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">URL do Webhook *</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              placeholder="https://api.seudominio.com/webhooks/whatsapp"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!url || isTesting}
              className="gap-2"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Testar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Deve ser uma URL HTTPS acessível publicamente
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
            <CheckCircle2 className={testResult.success ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-red-600"} />
            <AlertDescription className={testResult.success ? "text-emerald-700" : "text-red-700"}>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Verify Token */}
        <div className="space-y-2">
          <Label htmlFor="verify-token">Token de Verificação *</Label>
          <Input
            id="verify-token"
            placeholder="seu_token_secreto_aqui"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Use este token para validar as requisições da Meta
          </p>
        </div>

        {/* Events Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Eventos para Receber</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll}
              className="h-7 text-xs text-[#9795e4]"
            >
              {allSelected ? 'Desselecionar todos' : 'Selecionar todos'}
            </Button>
          </div>
          
          <div className="grid gap-3 rounded-lg border p-4">
            {WEBHOOK_EVENTS.map((event) => (
              <div key={event.value} className="flex items-start space-x-3">
                <Checkbox
                  id={event.value}
                  checked={selectedEvents.includes(event.value)}
                  onCheckedChange={() => handleEventToggle(event.value)}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor={event.value}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {event.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-lg bg-[#9795e4]/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-[#9795e4]" />
            <div>
              <h4 className="text-sm font-medium">Segurança do Webhook</h4>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-3 w-3 shrink-0" />
                  Sempre use HTTPS para proteger os dados
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                  Valide o token de verificação em cada requisição
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                  Responda com código 200 em até 20 segundos
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!url || !verifyToken || selectedEvents.length === 0 || isLoading}
            className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configuração
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
