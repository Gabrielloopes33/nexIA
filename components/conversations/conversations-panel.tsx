"use client"

import { useState } from "react"
import { Search, Star, AlertCircle } from "lucide-react"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Conversation } from "@/lib/types/conversation"

const avatarColors = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
]

const STATUS_CONFIG = {
  open: {
    label: "Aberta",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  pending: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  solved: {
    label: "Resolvida",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  closed: {
    label: "Fechada",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  instagram: "bg-pink-100 text-pink-600",
  iframe: "bg-purple-100 text-purple-700",
  email: "bg-blue-100 text-blue-700",
  sms: "bg-cyan-100 text-cyan-700",
}

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  conversations?: Conversation[]
}

export function ConversationsPanel({ selectedId, onSelect, conversations = [] }: Props) {
  const [search, setSearch] = useState("")

  const filtered = conversations.filter((c) => {
    const searchMatch =
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactCompany?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return searchMatch
  })

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Conversas</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} total</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#9795e4]/30"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa encontrada.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((conv, i) => {
              const statusConfig = STATUS_CONFIG[conv.status]
              const isHighPriority = conv.priority === "high" || conv.priority === "urgent"
              const channelColor = CHANNEL_COLORS[conv.channel] || "bg-muted text-muted-foreground"

              return (
                <li key={conv.id}>
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-all relative",
                      selectedId === conv.id
                        ? "bg-[#9795e4]/8 border-l-2 border-[#9795e4]"
                        : "hover:bg-accent border-l-2 border-transparent"
                    )}
                  >
                    {/* Priority Indicator */}
                    {isHighPriority && (
                      <div className="absolute left-0 top-4 h-6 w-1 rounded-r bg-red-500" />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                          avatarColors[i % avatarColors.length]
                        )}
                      >
                        {conv.contactAvatar}
                      </div>
                      {/* Assigned Agent Badge */}
                      {conv.assignedTo && (
                        <div
                          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#9795e4] text-[8px] font-bold text-white ring-2 ring-white"
                        >
                          {conv.assignedTo.avatar}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Header: Name + Time */}
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {conv.starred && (
                            <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
                          )}
                          <span className="truncate text-sm font-semibold text-foreground">
                            {conv.contactName}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeDate(conv.lastMessageAt)
                            .replace(" atrás", "")
                            .replace("Hoje", "hoje")
                            .replace("Ontem", "ontem")}
                        </span>
                      </div>

                      {/* Company */}
                      {conv.contactCompany && (
                        <p className="text-[11px] text-muted-foreground truncate mb-1">
                          {conv.contactCompany}
                        </p>
                      )}

                      {/* Preview */}
                      <p className="truncate text-xs text-muted-foreground mb-2">
                        {conv.lastMessage}
                      </p>

                      {/* Footer: Channel + Status + Unread */}
                      <div className="flex items-center gap-1.5">
                        {/* Channel Badge */}
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                            channelColor
                          )}
                        >
                          {conv.channel}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.label}
                        </span>

                        {/* SLA Warning */}
                        {conv.slaStatus === "breach" && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        )}

                        {/* Unread Count */}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-[#9795e4] px-1.5 text-[10px] font-bold text-white min-w-5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
