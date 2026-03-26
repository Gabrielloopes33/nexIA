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
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { useState } from "react"
import { useContactDeals } from "@/hooks/use-contact-deals"
import { useContactTimeline, TimelineEvent } from "@/hooks/use-contact-timeline"
import { cn } from "@/lib/utils"

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
  const hasError = dealsError || timelineError

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
            {dealsExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
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
                    className="rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{deal.title}</p>
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
