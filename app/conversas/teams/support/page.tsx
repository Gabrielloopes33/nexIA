/**
 * /conversas/teams/support
 * Página de conversas atribuídas à equipe de suporte
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function SupportTeamPage() {
  return (
    <ConversasFilteredPage
      filter="support"
      basePath="/conversas/teams/support"
      emptyTitle="Sem conversas"
      emptyMessage="Não há conversas atribuídas à equipe de suporte no momento."
    />
  )
}
