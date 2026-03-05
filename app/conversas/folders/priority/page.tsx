/**
 * /conversas/folders/priority
 * Página de conversas com prioridade alta ou urgente
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function PriorityFolderPage() {
  return (
    <ConversasFilteredPage
      filter="priority"
      basePath="/conversas/folders/priority"
      emptyTitle="Sem prioridades"
      emptyMessage="Não há conversas com prioridade alta ou urgente no momento."
    />
  )
}
