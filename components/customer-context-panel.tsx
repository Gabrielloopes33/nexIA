"use client"

import { 
  Building2, 
  Mail, 
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
  Tag as TagIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { useState } from "react"

interface Props {
  conversation: Conversation | null
}

interface Activity {
  id: string
  type: "message" | "note" | "call" | "email" | "status_change"
  description: string
  date: string
  user?: string
}

// Mock related deals and activities
const mockDeals = [
  { id: "1", name: "Contrato Anual - Plano Pro", value: 12000, stage: "Negociação", probability: 75 },
  { id: "2", name: "Upgrade Enterprise", value: 48000, stage: "Proposta", probability: 60 },
]

const mockActivities: Activity[] = [
  { id: "1", type: "message", description: "Cliente enviou mensagem via WhatsApp", date: "2025-02-26T14:30:00", user: "Sistema" },
  { id: "2", type: "status_change", description: "Status alterado: Aberto → Pendente", date: "2025-02-26T13:15:00", user: "Carlos Silva" },
  { id: "3", type: "note", description: "Cliente interessado em upgrade para Enterprise", date: "2025-02-25T16:45:00", user: "Ana Costa" },
  { id: "4", type: "call", description: "Ligação realizada (15min)", date: "2025-02-25T10:30:00", user: "Carlos Silva" },
  { id: "5", type: "email", description: "Email enviado com proposta comercial", date: "2025-02-24T09:00:00", user: "Ana Costa" },
]

export function CustomerContextPanel({ conversation }: Props) {
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [dealsExpanded, setDealsExpanded] = useState(true)
  const [activitiesExpanded, setActivitiesExpanded] = useState(true)

  if (!conversation) {
    return (
      <div className="flex w-[320px] shrink-0 flex-col items-center justify-center bg-background border-l border-border px-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9795e4]/10">
          <Building2 className="h-8 w-8 text-[#9795e4]" />
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

  const displayedActivities = showAllActivities ? mockActivities : mockActivities.slice(0, 3)

  return (
    <div className="flex w-[320px] shrink-0 flex-col bg-background border-l border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Contexto do Cliente</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
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
            {conversation.contactEmail && (
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a href={`mailto:${conversation.contactEmail}`} className="text-[#9795e4] hover:underline truncate">
                  {conversation.contactEmail}
                </a>
              </div>
            )}
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
                {mockDeals.length}
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
              {mockDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{deal.name}</p>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {deal.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#9795e4]">
                      {formatCurrency(deal.value)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {deal.probability}% prob.
                    </span>
                  </div>
                </div>
              ))}
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
            </div>
            {activitiesExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {activitiesExpanded && (
            <div className="px-5 pb-4">
              <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                {displayedActivities.map((activity, index) => {
                  const isLast = index === displayedActivities.length - 1
                  return (
                    <div key={activity.id} className="relative pl-6">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background ${
                          activity.type === "message"
                            ? "bg-blue-500"
                            : activity.type === "note"
                            ? "bg-purple-500"
                            : activity.type === "call"
                            ? "bg-green-500"
                            : activity.type === "email"
                            ? "bg-orange-500"
                            : "bg-gray-500"
                        }`}
                      />

                      {/* Activity content */}
                      <div className="text-xs">
                        <p className="text-foreground font-medium leading-snug">
                          {activity.description}
                        </p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">
                          {formatDate(activity.date)}
                          {activity.user && ` • ${activity.user}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {mockActivities.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="w-full mt-3 text-xs"
                >
                  {showAllActivities ? "Ver menos" : `Ver todas (${mockActivities.length})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
