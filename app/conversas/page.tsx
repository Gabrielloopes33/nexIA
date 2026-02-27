"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { ChatSubSidebar } from "@/components/conversations/chat-sub-sidebar"
import { ConversationsPanel } from "@/components/conversations/conversations-panel"
import { ChatWindow } from "@/components/chat-window"
import { CustomerContextPanel } from "@/components/customer-context-panel"
import { Conversation } from "@/lib/types/conversation"
import { MOCK_CONVERSATIONS_DATA } from "@/lib/mock-conversations"

function ConversasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationIdFromUrl = searchParams.get("id")
  
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS_DATA)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationIdFromUrl)
  
  // Sincronizar ID da URL com estado
  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== selectedConversation) {
      setSelectedConversation(conversationIdFromUrl)
    }
  }, [conversationIdFromUrl])

  // Handler para selecionar conversa
  const handleSelectConversation = (id: string | null) => {
    setSelectedConversation(id)
    if (id) {
      router.push(`/conversas?id=${id}`, { scroll: false })
    } else {
      router.push("/conversas", { scroll: false })
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Chat Sub-Sidebar */}
      <ChatSubSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden ml-[292px]">
        {/* Conversations List */}
        <ConversationsPanel
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
        />

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow 
            conversation={conversations.find(c => c.id === selectedConversation) || null} 
          />
        </div>

        {/* Customer Context Panel */}
        <CustomerContextPanel 
          conversation={conversations.find(c => c.id === selectedConversation) || null} 
        />
      </main>
    </div>
  )
}

export default function ConversasPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9795e4] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    }>
      <ConversasPageContent />
    </Suspense>
  )
}
