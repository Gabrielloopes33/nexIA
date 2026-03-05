"use client"

import { Sidebar } from "@/components/sidebar"
import { WhatsAppSubSidebar } from "@/components/whatsapp/whatsapp-sub-sidebar"
import { ComplianceBanner } from "@/components/whatsapp/shared/compliance-banner"
import { WebhookConfigForm } from "@/components/whatsapp/webhooks/webhook-config-form"
import { WebhookLogs } from "@/components/whatsapp/webhooks/webhook-logs"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Webhook, 
  AlertCircle, 
  Shield,
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import { WEBHOOK_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import { getWebhookConfig, updateWebhookConfig, testWebhook, getWebhookLogs } from "@/lib/whatsapp/api"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import type { WebhookConfiguration, WebhookLog } from "@/lib/whatsapp/types"
import { cn } from "@/lib/utils"

export default function WhatsAppWebhooksPage() {
  const { account, status } = useWhatsApp()
  const isConnected = status === 'connected'

  const [config, setConfig] = useState<WebhookConfiguration | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const loadConfig = useCallback(async () => {
    if (!account?.wabaId) return
    setIsLoading(true)
    try {
      const data = await getWebhookConfig(account.wabaId)
      setConfig(data)
    } finally {
      setIsLoading(false)
    }
  }, [account?.wabaId])

  const loadLogs = useCallback(async () => {
    if (!config?.id) return
    setIsLoadingLogs(true)
    try {
      const data = await getWebhookLogs(config.id)
      setLogs(data)
    } finally {
      setIsLoadingLogs(false)
    }
  }, [config?.id])

  useEffect(() => {
    if (isConnected) {
      loadConfig()
      loadLogs()
    }
  }, [isConnected, loadConfig, loadLogs])

  const handleSave = async (newConfig: { url: string; verifyToken: string; events: string[] }) => {
    if (!account?.wabaId) return
    setIsLoading(true)
    try {
      const updated = await updateWebhookConfig(account.wabaId, newConfig)
      setConfig(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async (url: string) => {
    return testWebhook(url)
  }

  if (!isConnected) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <WhatsAppSubSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Conecte sua conta WhatsApp Business para configurar webhooks.{' '}
              <Link href="/integracoes/whatsapp/connect" className="font-medium underline">
                Conectar agora
                <ArrowRight className="ml-1 inline-block h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* WhatsApp Sub-Sidebar */}
      <WhatsAppSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9795e4]/10">
              <Webhook className="h-5 w-5 text-[#9795e4]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Webhooks</h1>
              <p className="text-sm text-muted-foreground">
                Configure endpoints para receber eventos do WhatsApp em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Messages */}
        <div className="mb-6 space-y-3">
          {WEBHOOK_COMPLIANCE_MESSAGES.map((message, index) => (
            <ComplianceBanner key={index} message={message} />
          ))}
        </div>

        {/* Connection Status */}
        {config && (
          <Alert className={cn(
            "mb-6",
            config.active 
              ? "border-emerald-200 bg-emerald-50" 
              : "border-amber-200 bg-amber-50"
          )}>
            <CheckCircle2 className={cn(
              "h-4 w-4",
              config.active ? "text-emerald-600" : "text-amber-600"
            )} />
            <AlertDescription className={config.active ? "text-emerald-700" : "text-amber-700"}>
              Webhook {config.active ? 'ativo' : 'inativo'} - {config.events.length} eventos configurados
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Form */}
          <WebhookConfigForm
            config={config ? {
              url: config.url,
              verifyToken: config.verifyToken,
              events: config.events,
              active: config.active,
            } : undefined}
            onSave={handleSave}
            onTest={handleTest}
            isLoading={isLoading}
          />

          {/* Logs */}
          <WebhookLogs
            logs={logs}
            onRefresh={loadLogs}
            isLoading={isLoadingLogs}
          />
        </div>

        {/* Documentation Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#9795e4]" />
              <CardTitle className="text-lg">Implementação do Webhook</CardTitle>
            </div>
            <CardDescription>
              Guia rápido para implementar o endpoint de webhook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Exemplo de endpoint (Node.js/Express):</p>
                <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
{`app.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhooks/whatsapp', (req, res) => {
  const payload = req.body;
  
  // Processa o evento
  console.log('Evento recebido:', payload);
  
  // Responde rapidamente
  res.status(200).send('OK');
});`}
                </pre>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-2 font-medium">Verificação</h4>
                  <p className="text-sm text-muted-foreground">
                    O endpoint deve responder ao challenge de verificação durante 
                    a configuração.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-2 font-medium">Resposta Rápida</h4>
                  <p className="text-sm text-muted-foreground">
                    Responda em menos de 20 segundos com código 200 para evitar 
                    retentativas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
