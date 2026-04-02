"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Calendar,
  Users,
  Unplug,
  ExternalLink,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { useOrganizationId } from "@/lib/contexts/organization-context"

// ─── Ícone do Calendly ────────────────────────────────────────────────────────

function CalendlyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 3.6C17.52 1.35 14.57 0 11.33 0 5.07 0 0 5.07 0 11.33c0 3.24 1.35 6.19 3.6 8.26L0 24l4.41-3.6c2.07 2.25 5.02 3.6 8.26 3.6C18.93 24 24 18.93 24 12.67c0-3.24-1.35-6.19-3.6-8.26l-.81-.81zM12 20.4c-4.64 0-8.4-3.76-8.4-8.4S7.36 3.6 12 3.6 20.4 7.36 20.4 12 16.64 20.4 12 20.4zm3.6-9.6h-2.4V7.2h-2.4v6h4.8v-2.4z" />
    </svg>
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CalendlyIntegration {
  id: string
  organizationId: string
  calendlyUserName?: string
  calendlyUserEmail?: string
  webhookSubscriptionUri?: string
  status: string
  totalBookings: number
  lastBookingAt?: string
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING:      { label: "Não configurado", variant: "secondary" },
  ACTIVE:       { label: "Ativo",           variant: "default" },
  ERROR:        { label: "Erro",            variant: "destructive" },
  DISCONNECTED: { label: "Desconectado",    variant: "secondary" },
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalendlyIntegrationPage() {
  const organizationId = useOrganizationId()

  const [integration, setIntegration] = useState<CalendlyIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [accessToken, setAccessToken] = useState("")

  const fetchIntegration = useCallback(async () => {
    if (!organizationId) return
    try {
      const res = await fetch(`/api/integrations/calendly?organizationId=${organizationId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setIntegration(json.data)
      } else {
        setIntegration(null)
      }
    } catch {
      toast.error("Erro ao carregar integração")
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchIntegration()
  }, [fetchIntegration])

  const handleConnect = async () => {
    if (!organizationId) {
      toast.error("Organização não encontrada. Recarregue a página.")
      return
    }
    if (!accessToken.trim()) {
      toast.error("Insira o token de acesso pessoal do Calendly")
      return
    }
    setConnecting(true)
    try {
      const res = await fetch("/api/integrations/calendly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, accessToken: accessToken.trim() }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setIntegration(json.data)
      setAccessToken("")
      toast.success("Calendly conectado! Agendamentos serão sincronizados automaticamente.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao conectar")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const res = await fetch(`/api/integrations/calendly?organizationId=${organizationId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setIntegration(null)
      toast.success("Calendly desconectado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar")
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const isActive = integration?.status === "ACTIVE"

  // ─── Não conectado ─────────────────────────────────────────────────────────
  if (!integration || !isActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006BFF]/10 flex items-center justify-center">
            <CalendlyIcon className="h-5 w-5 text-[#006BFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calendly</h1>
            <p className="text-muted-foreground text-sm">Sincronize agendamentos do Calendly automaticamente</p>
          </div>
        </div>

        {/* Formulário de conexão */}
        <Card>
          <CardHeader>
            <CardTitle>Conectar Calendly</CardTitle>
            <CardDescription>
              Insira seu token de acesso pessoal para ativar a sincronização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token de Acesso Pessoal</label>
              <Input
                type="password"
                placeholder="eyJraWQi..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <p className="text-xs text-muted-foreground">
                Gere em{" "}
                <a
                  href="https://calendly.com/integrations/api_webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006BFF] underline inline-flex items-center gap-1"
                >
                  Calendly → Integrações → Tokens de acesso pessoal
                  <ExternalLink className="h-3 w-3" />
                </a>
                {" "}com os escopos: <strong>webhooks:read</strong>, <strong>webhooks:write</strong>, <strong>scheduled_events:read</strong>
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting || !accessToken.trim() || !organizationId}
              className="w-full bg-[#006BFF] hover:bg-[#005AE0] text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Conectar e ativar webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* O que acontece */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O que acontece quando alguém agenda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Users,    label: "Contato encontrado ou criado automaticamente pelo e-mail" },
              { icon: Calendar, label: "Reunião criada em Agendamentos com data, hora e link" },
              { icon: Zap,      label: "Cancelamentos no Calendly atualizam o status no CRM" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#006BFF]/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#006BFF]" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Conectado ─────────────────────────────────────────────────────────────
  const statusInfo = STATUS_LABEL[integration.status] ?? { label: integration.status, variant: "secondary" as const }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006BFF]/10 flex items-center justify-center">
            <CalendlyIcon className="h-5 w-5 text-[#006BFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calendly</h1>
            {integration.calendlyUserName && (
              <p className="text-muted-foreground text-sm">
                Conectado como {integration.calendlyUserName}
              </p>
            )}
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{integration.totalBookings}</p>
            <p className="text-sm text-muted-foreground">Agendamentos recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {integration.lastBookingAt
                ? new Date(integration.lastBookingAt).toLocaleDateString("pt-BR")
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Último agendamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Status ativo */}
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
          Integração ativa. Novos agendamentos do Calendly serão criados automaticamente em{" "}
          <strong>Agendamentos → Reuniões</strong>.
        </AlertDescription>
      </Alert>

      {/* Webhook info */}
      {integration.webhookSubscriptionUri && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            Webhook registrado e ativo no Calendly.
          </AlertDescription>
        </Alert>
      )}

      {/* Reconectar com novo token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atualizar token</CardTitle>
          <CardDescription>
            Se seu token expirou ou foi revogado, insira um novo para reativar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Novo token de acesso pessoal..."
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <Button
            onClick={handleConnect}
            disabled={connecting || !accessToken.trim()}
            variant="outline"
            className="w-full"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar token e reativar webhook"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
              >
                <Unplug className="h-4 w-4" />
                Desconectar Calendly
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar Calendly?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso remove o webhook do Calendly e para de sincronizar novos agendamentos.
                  Os agendamentos já criados no CRM não serão afetados. Você pode reconectar a qualquer momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
