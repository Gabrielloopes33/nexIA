/**
 * /conversas/unattended
 * Página de conversas não atendidas
 * 
 * Lógica: Conversas abertas sem agente atribuído OU com SLA em breach/warning
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function UnattendedPage() {
  return (
    <ConversasFilteredPage
      filter="unattended"
      basePath="/conversas/unattended"
      emptyTitle="Ótimo trabalho!"
      emptyMessage="Nenhuma conversa não atendida no momento. Todas as conversas estão sendo acompanhadas dentro do prazo de SLA."
    />
  )
}
