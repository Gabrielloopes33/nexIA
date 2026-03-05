/**
 * /conversas
 * Página principal de todas as conversas (sem filtro)
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function ConversasPage() {
  return (
    <ConversasFilteredPage
      filter="all"
      basePath="/conversas"
    />
  )
}
