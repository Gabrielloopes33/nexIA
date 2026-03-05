/**
 * useConversasPage - Hook compartilhado para páginas filtradas de conversas
 * 
 * Encapsula toda a lógica comum das páginas de conversas:
 * - Estado de conversa selecionada
 * - Sincronização com URL (search params)
 * - Navegação programática
 * - Filtragem de conversas
 */

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Conversation } from "@/lib/types/conversation"
import { MOCK_CONVERSATIONS_DATA } from "@/lib/mock-conversations"

export interface UseConversasPageOptions {
  /** Função de filtro para as conversas - deve ser memoizada com useCallback */
  filterFn: (conversation: Conversation) => boolean
  /** Base path para navegação (ex: "/conversas", "/conversas/unattended") */
  basePath: string
}

export interface UseConversasPageReturn {
  /** Lista de conversas filtradas */
  conversations: Conversation[]
  /** ID da conversa selecionada */
  selectedConversation: string | null
  /** Handler para selecionar uma conversa */
  handleSelectConversation: (id: string | null) => void
  /** Conversa selecionada (objeto completo) */
  selectedConversationData: Conversation | null
  /** Total de conversas filtradas */
  totalCount: number
  /** Indica se há conversas selecionadas */
  hasSelection: boolean
}

/**
 * Hook para gerenciar estado e navegação em páginas de conversas
 * 
 * @example
 * ```tsx
 * const { conversations, selectedConversation, handleSelectConversation } = useConversasPage({
 *   filterFn: (c) => c.status === "open",
 *   basePath: "/conversas/unattended"
 * })
 * ```
 */
export function useConversasPage(options: UseConversasPageOptions): UseConversasPageReturn {
  const { filterFn, basePath } = options
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationIdFromUrl = searchParams.get("id")
  
  // Usar ref para rastrear o basePath atual e forçar atualização quando mudar
  const currentBasePath = useRef(basePath)
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Forçar atualização quando o basePath mudar (navegação entre páginas)
  useEffect(() => {
    if (currentBasePath.current !== basePath) {
      currentBasePath.current = basePath
      setForceUpdate(prev => prev + 1)
    }
  }, [basePath])

  // Estado de todas as conversas (mock data) - recriar quando basePath mudar
  const allConversations = useMemo(() => MOCK_CONVERSATIONS_DATA, [forceUpdate])

  // Aplicar filtro nas conversas - recalcular quando filterFn ou basePath mudar
  const conversations = useMemo(() => {
    console.log(`[useConversasPage] Aplicando filtro para: ${basePath}`)
    const filtered = allConversations.filter(filterFn)
    console.log(`[useConversasPage] Conversas filtradas: ${filtered.length} de ${allConversations.length}`)
    return filtered
  }, [allConversations, filterFn, basePath, forceUpdate])

  // Estado da conversa selecionada - resetar quando mudar de página
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    conversationIdFromUrl
  )
  
  // Resetar seleção quando mudar de página
  useEffect(() => {
    setSelectedConversation(conversationIdFromUrl)
  }, [basePath, conversationIdFromUrl])

  // Sincronizar ID da URL com estado
  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== selectedConversation) {
      setSelectedConversation(conversationIdFromUrl)
    }
  }, [conversationIdFromUrl, selectedConversation])

  // Handler para selecionar conversa
  const handleSelectConversation = (id: string | null) => {
    setSelectedConversation(id)
    if (id) {
      router.push(`${basePath}?id=${id}`, { scroll: false })
    } else {
      router.push(basePath, { scroll: false })
    }
  }

  // Obter dados da conversa selecionada
  const selectedConversationData = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversation) || null
  }, [conversations, selectedConversation])

  return {
    conversations,
    selectedConversation,
    handleSelectConversation,
    selectedConversationData,
    totalCount: conversations.length,
    hasSelection: selectedConversation !== null,
  }
}
