"use client"

import { 
  Building2, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar,
  MessageSquare,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Tag as TagIcon,
  Loader2,
  RefreshCw,
  FileText,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { useState } from "react"
import { useContactDeals, ContactDeal } from "@/hooks/use-contact-deals"
import { useContactTimeline, TimelineEvent } from "@/hooks/use-contact-timeline"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

interface Props {
  conversation: Conversation | null
}

// Mapear tipos de atividades do timeline para ícones e cores
const activityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  message: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500", label: "Mensagem" },
  whatsapp: { icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500", label: "WhatsApp" },
  note: { icon: FileText, color: "text-purple-500", bgColor: "bg-purple-500", label: "Nota" },
  call: { icon: PhoneCall, color: "text-green-500", bgColor: "bg-green-500", label: "Ligação" },
  meeting: { icon: Users, color: "text-orange-500", bgColor: "bg-orange-500", label: "Reunião" },
  task: { icon: CheckCircle2, color: "text-yellow-500", bgColor: "bg-yellow-500", label: "Tarefa" },
  deal: { icon: DollarSign, color: "text-[#46347F]", bgColor: "bg-[#46347F]", label: "Negócio" },
}

export function CustomerContextPanel({ conversation }: Props) {
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [dealsExpanded, setDealsExpanded] = useState(true)
  const [activitiesExpanded, setActivitiesExpanded] = useState(true)
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state for new deal
  const [dealForm, setDealForm] = useState({
    title: '',
    value: '',
    description: '',
  })

  const organizationId = useOrganizationId()

  // Buscar dados reais do backend
  const { 
    deals, 
    isLoading: isLoadingDeals, 
    error: dealsError, 
    refresh: refreshDeals 
  } = useContactDeals(conversation?.contactId)

  const { 
    events: timelineEvents, 
    isLoading: isLoadingTimeline, 
    error: timelineError, 
    refresh: refreshTimeline 
  } = useContactTimeline(conversation?.contactId)

  // Filtrar apenas deals abertos para exibição principal
  const openDeals = deals.filter(d => d.status === 'OPEN')
  const hasDeals = deals.length > 0

  // Preparar atividades para exibição (excluir mensagens duplicadas se necessário)
  const activities = timelineEvents.filter(event => 
    ['note', 'call', 'meeting', 'task', 'deal'].includes(event.type)
  )
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 5)

  const isLoading = isLoadingDeals || isLoadingTimeline

  // Buscar estágio padrão do pipeline
  const fetchDefaultStage = async () => {
    try {
      const response = await fetch('/api/pipeline/stages')
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        // Retorna o primeiro estágio ou o que tem isDefault = true
        const defaultStage = data.data.find((s: any) => s.isDefault) || data.data[0]
        return defaultStage.id
      }
      return null
    } catch {
      return null
    }
  }

  // Criar novo negócio
  const handleCreateDeal = async () => {
    if (!conversation?.contactId || !organizationId) {
      toast.error('Informações incompletas')
      return
    }

    if (!dealForm.title.trim()) {
      toast.error('Título do negócio é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      // Busca o estágio padrão
      const stageId = await fetchDefaultStage()
      if (!stageId) {
        throw new Error('Nenhum estágio encontrado no pipeline. Configure o pipeline primeiro.')
      }

      const response = await fetch('/api/pipeline/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealForm.title,
          value: parseFloat(dealForm.value) || 0,
          description: dealForm.description,
          contactId: conversation.contactId,
          stageId,
          channel: 'whatsapp',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar negócio')
      }

      toast.success('Negócio criado com sucesso!')
      setDealForm({ title: '', value: '', description: '' })
      setIsCreateDealOpen(false)
      refreshDeals()
      refreshTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar negócio')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deletar negócio
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Tem certeza que deseja excluir este negócio?')) return

    try {
      const response = await fetch(`/api/pipeline/deals/${dealId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir negócio')
      }

      toast.success('Negócio excluído com sucesso!')
      refreshDeals()
      refreshTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir negócio')
    }
  }

  if (!conversation) {
    return (
      <div className="flex w-[320px] shrink-0 flex-col items-center justify-center bg-background border-l border-border px-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#46347F]/10">
          <Building2 className="h-8 w-8 text-[#46347F]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground text-center">
          Nenhuma conversa selecionada
        </p>
        <p className="mt-1 text-xs text-muted-foreground text-center">
          Selecione uma conversa para ver o contexto do cliente
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-[320px] shrink-0 flex-col bg-background border-l border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Contexto do Cliente</h3>
        <div className="flex items-center gap-1">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => {
              refreshDeals()
              refreshTimeline()
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Customer Info */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {conversation.contactAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {conversation.contactName}
              </h4>
              {conversation.contactPosition && (
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.contactPosition}
                </p>
              )}
              {conversation.contactCompany && (
                <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {conversation.contactCompany}
                </p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-4 space-y-2">
            {conversation.contactPhone && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a href={`tel:${conversation.contactPhone}`} className="text-foreground hover:underline">
                  {conversation.contactPhone}
                </a>
              </div>
            )}
          </div>

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {conversation.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-[10px] font-medium px-2 py-0.5 flex items-center gap-1"
                >
                  <TagIcon className="h-2.5 w-2.5" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase">Mensagens</span>
            </div>
            <p className="text-lg font-bold text-foreground">{conversation.messageCount || 0}</p>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase">Não Lidas</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {conversation.unreadCount || 0}
            </p>
          </div>
        </div>

        {/* Related Deals */}
        <div className="border-b border-border">
          <button
            onClick={() => setDealsExpanded(!dealsExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Negócios Relacionados</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingDeals ? '...' : deals.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Botão Novo Negócio */}
              <Dialog open={isCreateDealOpen} onOpenChange={setIsCreateDealOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Negócio</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={dealForm.title}
                        onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                        placeholder="Ex: Contrato Anual - Plano Pro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="value">Valor (R$)</Label>
                      <Input
                        id="value"
                        type="number"
                        value={dealForm.value}
                        onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={dealForm.description}
                        onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                        placeholder="Detalhes do negócio..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleCreateDeal}
                      disabled={isSubmitting}
                      className="bg-[#46347F] hover:bg-[#46347F]/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Negócio'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {dealsExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {dealsExpanded && (
            <div className="px-5 pb-4 space-y-2">
              {isLoadingDeals ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : dealsError ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar negócios</span>
                </div>
              ) : !hasDeals ? (
                <div className="py-3 text-xs text-muted-foreground text-center">
                  Nenhum negócio encontrado
                </div>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{deal.title}</p>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className="text-[9px] shrink-0"
                          style={{ 
                            borderColor: deal.status === 'OPEN' ? deal.stage.color : undefined,
                            color: deal.status === 'OPEN' ? deal.stage.color : undefined 
                          }}
                        >
                          {deal.status === 'OPEN' ? deal.stage.name : 
                           deal.status === 'WON' ? 'Ganho' :
                           deal.status === 'LOST' ? 'Perdido' :
                           deal.status === 'PAUSED' ? 'Pausado' : deal.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteDeal(deal.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#46347F]">
                        {formatCurrency(deal.value)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {deal.stage.probability}% prob.
                      </span>
                    </div>
                    {deal.assignedUser && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Responsável: {deal.assignedUser.name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <button
            onClick={() => setActivitiesExpanded(!activitiesExpanded)}
            className="flex w-full items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Histórico de Atividades</span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {isLoadingTimeline ? '...' : activities.length}
              </Badge>
            </div>
            {activitiesExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {activitiesExpanded && (
            <div className="px-5 pb-4">
              {isLoadingTimeline ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : timelineError ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar atividades</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-3 text-xs text-muted-foreground text-center">
                  Nenhuma atividade registrada
                </div>
              ) : (
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  {displayedActivities.map((activity, index) => {
                    const isLast = index === displayedActivities.length - 1
                    const config = activityConfig[activity.type] || activityConfig.note
                    const Icon = config.icon

                    return (
                      <div key={activity.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background ${config.bgColor}`}
                        />

                        {/* Activity content */}
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Icon className={cn("h-3 w-3", config.color)} />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">
                              {config.label}
                            </span>
                          </div>
                          <p className="text-foreground font-medium leading-snug">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-muted-foreground text-[10px] mt-1">
                            {formatDate(activity.date)}
                            {activity.author && activity.author !== 'Sistema' && ` • ${activity.author}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activities.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full mt-3 text-xs"
                >
                  {showAllActivities ? "Ver menos" : `Ver todas (${activities.length})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
