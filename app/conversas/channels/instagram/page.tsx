/**
 * /conversas/channels/instagram
 * Página de conversas do canal Instagram
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function InstagramChannelPage() {
  return (
    <ConversasFilteredPage
      filter="instagram"
      basePath="/conversas/channels/instagram"
      emptyTitle="Sem conversas"
      emptyMessage="Não há conversas no canal Instagram no momento."
    />
  )
}
