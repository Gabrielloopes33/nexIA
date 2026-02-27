"use client"

import { useState } from "react"
import { Search, ChevronDown, AlertCircle, Star } from "lucide-react"
import { cn, formatRelativeDate } from "@/lib/utils"
import { Conversation, Channel } from "@/lib/types/conversation"

const channels = ["Todos", "WhatsApp", "Instagram", "Iframe", "Email", "SMS"]

const channelColors: Record<string, string> = {
  Todos: "bg-[#7C3AED] text-white",
  WhatsApp: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  Instagram: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  Iframe: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  Email: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  SMS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
}

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

const PRIORITY_CONFIG = {
  low: { color: "bg-gray-400", label: "Baixa" },
  medium: { color: "bg-amber-400", label: "Média" },
  high: { color: "bg-orange-500", label: "Alta" },
  urgent: { color: "bg-red-600", label: "Urgente" },
}

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  conversations?: Conversation[]
}

export function ConversationsPanel({ selectedId, onSelect, conversations = [] }: Props) {
  const [activeChannel, setActiveChannel] = useState("Todos")
  const [search, setSearch] = useState("")

  const filtered = conversations.filter((c) => {
    const channelMatch = activeChannel === "Todos" || 
      c.channel.toLowerCase() === activeChannel.toLowerCase()
    const searchMatch =
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactCompany?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return channelMatch && searchMatch
  })

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
      {/* Agent selector */}
      <div className="border-b border-border px-4 py-3">
        <button className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          <span>Agente Central</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Conversations header + filters */}
      <div className="px-4 pt-4">
        <h2 className="mb-3 text-base font-semibold text-foreground">Conversas</h2>

        {/* Channel filter chips */}
        <div className="mb-3 flex flex-wrap gap-2">
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeChannel === ch
                  ? channelColors[ch]
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID ou conteudo..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
            />
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent">
            Recentes
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-3 h-px bg-border" />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 ? (
          <p className="px-2 pt-4 text-sm text-muted-foreground">
            Nenhuma conversa encontrada.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((conv, i) => {
              const statusConfig = STATUS_CONFIG[conv.status]
              const priorityConfig = PRIORITY_CONFIG[conv.priority]
              const isHighPriority = conv.priority === "high" || conv.priority === "urgent"
              const channelName = conv.channel.charAt(0).toUpperCase() + conv.channel.slice(1)

              return (
                <li key={conv.id}>
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all relative",
                      selectedId === conv.id
                        ? "bg-[#7C3AED]/8 ring-1 ring-[#7C3AED]/20"
                        : "hover:bg-accent"
                    )}
                  >
                    {/* Priority Indicator */}
                    {isHighPriority && (
                      <div className="absolute left-0 top-3 h-8 w-1 rounded-r bg-red-500" />
                    )}

                    {/* Avatar with Status/Assignment */}
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
                          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 ring-2 ring-card text-[8px] font-bold text-purple-700 dark:text-purple-300"
                          title={`Atribuído a ${conv.assignedTo.name}`}
                        >
                          {conv.assignedTo.avatar}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Header: Name + Time + Star */}
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
                            .replace("Hoje", "ago")
                            .replace("Ontem", "1d")}
                        </span>
                      </div>

                      {/* Company (if exists) */}
                      {conv.contactCompany && (
                        <p className="text-[11px] text-muted-foreground truncate mb-1">
                          {conv.contactCompany}
                        </p>
                      )}

                      {/* Preview */}
                      <p className="truncate text-xs text-muted-foreground mb-2">
                        {conv.lastMessage}
                      </p>

                      {/* Footer: Status, Channel, Tags, Unread */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.label}
                        </span>

                        {/* Channel Badge */}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            channelColors[channelName] ?? "bg-muted text-muted-foreground"
                          )}
                        >
                          {channelName}
                        </span>

                        {/* Tags (max 1) */}
                        {conv.tags.length > 0 && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {conv.tags[0]}
                          </span>
                        )}

                        {/* SLA Warning */}
                        {conv.slaStatus === "breach" && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" title="SLA vencido" />
                        )}
                        {conv.slaStatus === "warning" && (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" title="SLA em risco" />
                        )}

                        {/* Unread Count */}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-[#7C3AED] px-1.5 text-[10px] font-bold text-white min-w-5">
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
