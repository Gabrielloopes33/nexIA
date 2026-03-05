/**
 * /conversas/folders/leads
 * Página de conversas marcadas com tag "lead"
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function LeadsFolderPage() {
  return (
    <ConversasFilteredPage
      filter="leads"
      basePath="/conversas/folders/leads"
      emptyTitle="Sem leads"
      emptyMessage="Não há conversas marcadas como lead no momento."
    />
  )
}
