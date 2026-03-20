/**
 * /conversas/nao-atribuidas
 * Página de conversas sem atribuição (disponíveis)
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function ConversasNaoAtribuidasPage() {
  return (
    <ConversasFilteredPage
      filter="unassigned"
      basePath="/conversas/nao-atribuidas"
      emptyTitle="Tudo em ordem!"
      emptyMessage="Não há conversas aguardando atribuição no momento."
    />
  )
}
