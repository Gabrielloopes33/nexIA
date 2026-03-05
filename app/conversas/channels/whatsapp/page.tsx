/**
 * /conversas/channels/whatsapp
 * Página de conversas do canal WhatsApp
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function WhatsAppChannelPage() {
  return (
    <ConversasFilteredPage
      filter="whatsapp"
      basePath="/conversas/channels/whatsapp"
      emptyTitle="Sem conversas"
      emptyMessage="Não há conversas no canal WhatsApp no momento."
    />
  )
}
