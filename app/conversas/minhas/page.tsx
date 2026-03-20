/**
 * /conversas/minhas
 * Página de conversas atribuídas ao usuário logado
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function MinhasConversasPage() {
  return (
    <ConversasFilteredPage
      filter="mine"
      basePath="/conversas/minhas"
      emptyTitle="Nenhuma conversa atribuída"
      emptyMessage="Você não tem conversas atribuídas no momento. Confira as conversas não atribuídas para pegar uma."
    />
  )
}
