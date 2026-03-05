/**
 * /conversas/channels/chat-widget
 * Página de conversas do canal Chat Widget (iframe/chat)
 */

import { ConversasFilteredPage } from "@/components/conversations/conversas-filtered-page"

export default function ChatWidgetChannelPage() {
  return (
    <ConversasFilteredPage
      filter="chat-widget"
      basePath="/conversas/channels/chat-widget"
      emptyTitle="Sem conversas"
      emptyMessage="Não há conversas no Chat Widget no momento."
    />
  )
}
