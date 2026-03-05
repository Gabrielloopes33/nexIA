/**
 * /conversas/teams/sales
 * Página de conversas atribuídas à equipe de vendas
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function SalesTeamPage() {
  return (
    <ConversasFilteredPage
      filter="sales"
      basePath="/conversas/teams/sales"
      emptyTitle="Sem conversas"
      emptyMessage="Não há conversas atribuídas à equipe de vendas no momento."
    />
  )
}
