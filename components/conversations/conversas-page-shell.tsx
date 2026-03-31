"use client"

import { Suspense, useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ConversationsPanel } from "@/components/conversations/conversations-panel"
import { ChatWindow } from "@/components/chat-window"
import { CustomerContextPanel } from "@/components/customer-context-panel"
import { NewConversationModal } from "@/components/conversations/new-conversation-modal"
import { useConversasPage } from "@/lib/hooks/use-conversas-page"
import { Conversation } from "@/lib/types/conversation"
import { Inbox } from "lucide-react"
import { ConversationSelectionProvider } from "@/lib/contexts/conversation-selection-context"
import { BulkActionsBar } from "./bulk-actions-bar"
import { useConversations } from "@/hooks/use-conversations"

export interface ConversasPageShellProps {
  /** Função de filtro para as conversas */
  filterFn: (conversation: Conversation) => boolean
  /** Base path para navegação (ex: "/conversas/unattended") */
  basePath: string
  /** Título da página (aparece no empty state) */
  pageTitle?: string
  /** Mensagem quando não há conversas */
  emptyMessage?: string
  /** Título do estado vazio */
  emptyTitle?: string
  /** Ícone do estado vazio */
  emptyIcon?: React.ReactNode
}

/**
 * ConversasPageShell - Wrapper reutilizável para páginas de conversas
 * 
 * Renderiza o layout padrão de 3 colunas:
 * 1. Sidebar principal (roxa) com dropdowns
 * 2. Lista de conversas
 * 3. Janela de chat
 * 4. Painel de contexto do cliente
 * 
 * @example
 * ```tsx
 * // Página de não atendidas
 * <ConversasPageShell
 *   filterFn={(c) => c.assignedTo === null && c.status === "pending"}
 *   basePath="/conversas/unattended"
 *   pageTitle="Não Atendidas"
 *   emptyTitle="Tudo em ordem!"
 *   emptyMessage="Não há conversas aguardando atendimento no momento."
 * />
 * ```
 */
function ConversasPageShellContent({
  filterFn,
  basePath,
  emptyTitle = "Nenhuma conversa encontrada",
  emptyMessage = "Não há conversas que correspondam aos critérios atuais.",
  emptyIcon,
}: ConversasPageShellProps) {
  const {
    conversations,
    selectedConversation,
    handleSelectConversation,
    selectedConversationData,
    isLoading,
    error,
    deleteConversation,
  } = useConversasPage({ filterFn, basePath })
  
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  
  // Refetch após ações em massa
  const { mutate: refetchConversations } = useConversations({ limit: 100 })
  
  const handleActionComplete = useCallback(() => {
    // Refetch para atualizar a lista
    refetchConversations()
  }, [refetchConversations])

  const isEmpty = !isLoading && conversations.length === 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar with Dropdowns */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden min-w-0 relative">
        {/* Conversations List */}
        <ConversationsPanel
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
          onNewConversation={() => setIsNewConversationOpen(true)}
          onDeleteConversation={deleteConversation}
        />
        
        {/* New Conversation Modal */}
        <NewConversationModal
          open={isNewConversationOpen}
          onOpenChange={setIsNewConversationOpen}
        />

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          {isEmpty ? (
            <EmptyState
              title={emptyTitle}
              message={emptyMessage}
              icon={emptyIcon}
            />
          ) : (
            <ChatWindow conversation={selectedConversationData} />
          )}
        </div>

        {/* Customer Context Panel */}
        <CustomerContextPanel conversation={selectedConversationData} />
        
        {/* Bulk Actions Bar (flutuante) */}
        <BulkActionsBar
          availableIds={conversations.map(c => c.id)}
          onActionComplete={handleActionComplete}
        />
      </main>
    </div>
  )
}

/**
 * Estado vazio quando não há conversas
 */
interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
}

function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <div className="text-center p-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#46347F]/10 flex items-center justify-center mb-4">
          {icon || <Inbox className="w-8 h-8 text-[#46347F]" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{message}</p>
      </div>
    </div>
  )
}

/**
 * Wrapper com Suspense e SelectionProvider para carregamento
 */
export function ConversasPageShell(props: ConversasPageShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#46347F] border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando conversas...</p>
          </div>
        </div>
      }
    >
      <ConversationSelectionProvider>
        <ConversasPageShellContent {...props} />
      </ConversationSelectionProvider>
    </Suspense>
  )
}

export default ConversasPageShell
