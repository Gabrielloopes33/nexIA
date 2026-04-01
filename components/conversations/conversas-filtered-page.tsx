"use client"

import { useMemo, useCallback } from "react"
import { ConversasPageShell } from "./conversas-page-shell"
import { Conversation } from "@/lib/types/conversation"
import { getUserIdFromSession } from "@/lib/auth/client"

export type FilterType = 
  | "mine"           // Minhas conversas (atribuídas a mim)
  | "unassigned"     // Não atribuídas (disponíveis)
  | "unattended"     // Não atendidas (SLA/urgência)
  | "priority"       // Alta prioridade
  | "leads"
  | "sales"
  | "support"
  | "whatsapp"
  | "instagram"
  | "chat-widget"
  | "all"

interface ConversasFilteredPageProps {
  filter: FilterType
  basePath: string
  emptyTitle?: string
  emptyMessage?: string
}

/**
 * ConversasFilteredPage - Wrapper que resolve o filtro internamente
 * 
 * Este componente resolve o problema de passar funções de Server Components
 * para Client Components no Next.js App Router.
 * 
 * IMPORTANTE: Usamos useCallback para memoizar a função de filtro e 
 * useMemo para garantir que o filtro só mude quando o tipo mudar.
 */
export function ConversasFilteredPage({
  filter,
  basePath,
  emptyTitle,
  emptyMessage,
}: ConversasFilteredPageProps) {
  const currentUserId = useMemo(() => getUserIdFromSession(), [])

  // Memoizar a função de filtro para evitar recriação em cada render
  const filterFn = useCallback((c: Conversation): boolean => {
    switch (filter) {
      case "mine":
        return c.assignedTo?.id === currentUserId && c.status === "open"
      
      case "unassigned":
        // Conversas sem atribuição (disponíveis para pegar)
        return c.assignedTo === null && c.status === "open"
      
      case "unattended":
        // Conversas com SLA em breach/warning (independentemente de atribuição)
        return c.status === "open" && (
          c.slaStatus === "breach" || c.slaStatus === "warning"
        )
      
      case "priority":
        return c.priority === "high" || c.priority === "urgent"
      
      case "leads":
        return c.tags.some(tag => tag.toLowerCase().includes("lead"))
      
      case "sales":
        return c.teamId === "sales"
      
      case "support":
        return c.teamId === "support"
      
      case "whatsapp":
        return c.channel === "whatsapp"
      
      case "instagram":
        return c.channel === "instagram"
      
      case "chat-widget":
        return c.channel === "chat" || c.channel === "iframe"
      
      case "all":
      default:
        return true
    }
  }, [filter, currentUserId]) // Só recria quando filter ou usuário mudar

  return (
    <ConversasPageShell
      key={basePath} // Forçar remontagem quando mudar de rota
      filterFn={filterFn}
      basePath={basePath}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    />
  )
}
