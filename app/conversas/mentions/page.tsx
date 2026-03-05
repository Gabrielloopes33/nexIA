/**
 * /conversas/mentions
 * Página de conversas onde o usuário foi mencionado em notas internas
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function MentionsPage() {
  return (
    <ConversasFilteredPage
      filter="mentions"
      basePath="/conversas/mentions"
      emptyTitle="Nenhuma menção"
      emptyMessage="Você não foi mencionado em nenhuma conversa recente. As menções aparecem quando alguém te marca em uma nota interna."
    />
  )
}
