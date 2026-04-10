"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  useWebhooks,
  Webhook,
  CreateWebhookData,
  VALID_EVENTS,
} from "@/hooks/use-webhooks"
import {
  Plus,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Trash2,
  Edit,
  Link2,
  Clock,
  RefreshCw,
  Play,
  Loader2,
  Webhook as WebhookIcon,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

const statusConfig = {
  active: {
    label: "Ativo",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  paused: {
    label: "Pausado",
    icon: Pause,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  error: {
    label: "Erro",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700 border-red-200",
  },
}

const EVENT_CATEGORIES = [
  { key: 'Contatos', events: VALID_EVENTS.filter(e => e.category === 'Contatos') },
  { key: 'Negócios', events: VALID_EVENTS.filter(e => e.category === 'Negócios') },
  { key: 'Mensagens', events: VALID_EVENTS.filter(e => e.category === 'Mensagens') },
  { key: 'Agendamentos', events: VALID_EVENTS.filter(e => e.category === 'Agendamentos') },
  { key: 'Campanhas', events: VALID_EVENTS.filter(e => e.category === 'Campanhas') },
]

export default function WebhooksPage() {
  const {
    webhooks,
    isLoading,
    error,
    refreshWebhooks,
    createWebhook,
    deleteWebhook,
    testWebhook,
    toggleWebhookStatus,
  } = useWebhooks()
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [newWebhook, setNewWebhook] = useState<CreateWebhookData>({
    name: "",
    url: "",
    events: [],
    retryCount: 3,
  })

  const stats = {
    ativos: webhooks.filter((w) => w.status === "active").length,
    erros: webhooks.filter((w) => w.status === "error").length,
    pausados: webhooks.filter((w) => w.status === "paused").length,
  }

  const handleCreateWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e a URL do webhook.",
        variant: "destructive",
      })
      return
    }

    if (newWebhook.events.length === 0) {
      toast({
        title: "Selecione eventos",
        description: "Escolha pelo menos um evento para o webhook.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      await createWebhook(newWebhook)
      toast({
        title: "Webhook criado",
        description: `O webhook "${newWebhook.name}" foi criado com sucesso.`,
      })
      setNewWebhook({ name: "", url: "", events: [], retryCount: 3 })
      setIsCreateDialogOpen(false)
    } catch (err) {
      toast({
        title: "Erro ao criar webhook",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return

    try {
      setIsDeleting(true)
      await deleteWebhook(webhookToDelete.id)
      toast({
        title: "Webhook removido",
        description: `O webhook "${webhookToDelete.name}" foi removido com sucesso.`,
      })
      setWebhookToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (err) {
      toast({
        title: "Erro ao remover webhook",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      setIsTesting(webhook.id)
      const result = await testWebhook(webhook.id)

      if (result?.status === 'success') {
        toast({
          title: "Teste bem-sucedido",
          description: `Webhook respondeu com status ${result.statusCode} em ${result.responseTime}ms.`,
        })
      } else {
        toast({
          title: "Teste falhou",
          description: result?.error || `Status ${result?.statusCode || 'desconhecido'}`,
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro ao testar webhook",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(null)
    }
  }

  const handleToggleStatus = async (webhook: Webhook) => {
    try {
      setIsToggling(webhook.id)
      await toggleWebhookStatus(webhook.id, webhook.status)
      toast({
        title: webhook.status === "active" ? "Webhook pausado" : "Webhook ativado",
        description: `O webhook "${webhook.name}" foi ${webhook.status === "active" ? "pausado" : "ativado"}.`,
      })
    } catch (err) {
      toast({
        title: "Erro ao alterar status",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsToggling(null)
    }
  }

  const toggleEvent = (eventValue: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue],
    }))
  }

  const formatLastTriggered = (date: string | null) => {
    if (!date) return "Nunca disparado"
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie endpoints para receber eventos em tempo real
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie endpoints para receber eventos em tempo real
            </p>
          </div>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar webhooks</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshWebhooks} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#46347F] hover:bg-[#3a2b6a]">
              <Plus className="h-4 w-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um endpoint para receber notificações de eventos do sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Webhook Principal"
                  value={newWebhook.name}
                  onChange={(e) =>
                    setNewWebhook((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://meusite.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) =>
                    setNewWebhook((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="space-y-4 max-h-64 overflow-y-auto border rounded-md p-3">
                  {EVENT_CATEGORIES.map((category) => (
                    <div key={category.key} className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        {category.key}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {category.events.map((event) => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={event.value}
                              checked={newWebhook.events.includes(event.value)}
                              onCheckedChange={() => toggleEvent(event.value)}
                            />
                            <Label
                              htmlFor={event.value}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {event.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryCount">Tentativas em caso de falha</Label>
                <Select
                  value={newWebhook.retryCount?.toString()}
                  onValueChange={(value) =>
                    setNewWebhook((prev) => ({
                      ...prev,
                      retryCount: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tentativa</SelectItem>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="5">5 tentativas</SelectItem>
                    <SelectItem value="10">10 tentativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={isCreating}
                className="bg-[#46347F] hover:bg-[#3a2b6a]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Webhook"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <Link2 className="h-4 w-4 text-[#46347F]" />
            Webhooks Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {webhooks.length === 0 ? (
            <div className="p-8 text-center">
              <WebhookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro webhook para receber notificações de eventos em tempo real.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#46347F] hover:bg-[#3a2b6a]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Webhook
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhooks.map((webhook) => {
                const status = statusConfig[webhook.status]
                const StatusIcon = status.icon
                return (
                  <div
                    key={webhook.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-[#46347F]/10 flex items-center justify-center shrink-0">
                          <Globe className="h-5 w-5 text-[#46347F]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{webhook.name}</p>
                            {webhook.readOnly && (
                              <Badge variant="secondary" className="text-xs">
                                Integração
                              </Badge>
                            )}
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                                status.color
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </div>
                          </div>
                          <code className="text-xs text-muted-foreground block mt-1 truncate">
                            {webhook.url}
                          </code>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Último: {formatLastTriggered(webhook.lastTriggeredAt)}
                            </span>
                            {webhook.lastResponseStatus && (
                              <>
                                <span>•</span>
                                <Badge
                                  variant={
                                    webhook.lastResponseStatus >= 200 &&
                                    webhook.lastResponseStatus < 300
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  HTTP {webhook.lastResponseStatus}
                                </Badge>
                              </>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {webhook.events.slice(0, 4).map((evento) => {
                              const eventLabel = VALID_EVENTS.find(
                                (e) => e.value === evento
                              )?.label || evento
                              return (
                                <Badge
                                  key={evento}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {eventLabel}
                                </Badge>
                              )
                            })}
                            {webhook.events.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={Boolean(webhook.readOnly) || isTesting === webhook.id}
                          title="Testar webhook"
                        >
                          {isTesting === webhook.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Switch
                          checked={webhook.status === "active"}
                          onCheckedChange={() => handleToggleStatus(webhook)}
                          disabled={Boolean(webhook.readOnly) || isToggling === webhook.id}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={() => {
                            setWebhookToDelete(webhook)
                            setIsDeleteDialogOpen(true)
                          }}
                          disabled={Boolean(webhook.readOnly)}
                          title="Remover webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o webhook "{webhookToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
