/**
 * useConversasPage - Hook compartilhado para páginas filtradas de conversas
 * 
 * Encapsula toda a lógica comum das páginas de conversas:
 * - Busca de conversas da API real
 * - Estado de conversa selecionada
 * - Sincronização com URL (search params)
 * - Navegação programática
 * - Filtragem de conversas
 */

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Conversation as ApiConversation, useConversations } from "@/hooks/use-conversations"
import { Conversation, ConversationStatus, Channel, Priority } from "@/lib/types/conversation"

// Mapeia status da API para o formato do componente
function mapStatus(status: ApiConversation['status']): ConversationStatus {
  const map: Record<ApiConversation['status'], ConversationStatus> = {
    'ACTIVE': 'open',
    'EXPIRED': 'closed',
    'CLOSED': 'closed',
  }
  return map[status] || 'open'
}

// Mapeia conversa da API para o formato do componente
function mapConversation(apiConv: ApiConversation): Conversation {
  const contactName = apiConv.contact?.name || apiConv.contact?.phone || 'Desconhecido'
  const contactAvatar = contactName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  // Determina o canal baseado no instance ou valor padrão
  const channel: Channel = 'whatsapp' // TODO: Mapear corretamente quando tivermos o canal
  
  // Determina a prioridade baseada em alguma lógica ou valor padrão
  const priority: Priority = 'medium' // TODO: Adicionar campo priority na API
  
  // Extrai a última mensagem das mensagens da conversa
  const lastMessage = apiConv.messages && apiConv.messages.length > 0
    ? apiConv.messages[0].content
    : 'Sem mensagens'
  
  return {
    id: apiConv.id,
    contactId: apiConv.contactId,
    contactName,
    contactEmail: apiConv.contact?.phone || '',
    contactPhone: apiConv.contact?.phone,
    contactAvatar,
    channel,
    status: mapStatus(apiConv.status),
    priority,
    assignedTo: apiConv.instance ? {
      id: apiConv.instance.id,
      name: apiConv.instance.name || 'Agente',
      email: '',
      avatar: 'AG',
    } : null,
    tags: [], // TODO: Adicionar tags na API
    lastMessage,
    unreadCount: 0, // TODO: Calcular não lidas
    messageCount: apiConv.messageCount,
    createdAt: apiConv.createdAt,
    updatedAt: apiConv.createdAt,
    lastMessageAt: apiConv.lastMessageAt || apiConv.createdAt,
    messages: [], // Mensagens são carregadas separadamente
    starred: false,
    mentioned: false,
    teamId: null,
  }
}

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
  /** Indica se está carregando */
  isLoading: boolean
  /** Erro se houver */
  error: Error | null
}

/**
 * Hook para gerenciar estado e navegação em páginas de conversas
 * 
 * @example
 * ```tsx
 * const { conversations, selectedConversation, handleSelectConversation } = useConversasPage({
 *   filterFn: (c) => c.status === "ACTIVE",
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
  
  // Buscar conversas da API real
  const { conversations: allConversations, isLoading, error } = useConversations({
    limit: 100,
  })
  
  // Forçar atualização quando o basePath mudar (navegação entre páginas)
  useEffect(() => {
    if (currentBasePath.current !== basePath) {
      currentBasePath.current = basePath
      setForceUpdate(prev => prev + 1)
    }
  }, [basePath])

  // Mapear e aplicar filtro nas conversas
  const conversations = useMemo(() => {
    if (!allConversations || allConversations.length === 0) return []
    const mapped = allConversations.map(mapConversation)
    const filtered = mapped.filter(filterFn)
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
    isLoading,
    error,
  }
}
