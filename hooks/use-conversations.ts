"use client"

import { useCallback, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { useOrganizationId } from '@/lib/contexts/organization-context'
import { toast } from 'sonner'

export type ConversationStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED'
export type ConversationType = 'USER_INITIATED' | 'BUSINESS_INITIATED' | 'REFERRAL_INITIATED'
export type MessageDirection = 'INBOUND' | 'OUTBOUND'
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'TEMPLATE' | 'INTERACTIVE'
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface Message {
  id: string
  conversationId: string
  contactId: string
  messageId?: string
  direction: MessageDirection
  type: MessageType
  content: string
  mediaUrl?: string
  caption?: string
  templateId?: string
  template?: { id: string; name: string; category: string }
  status: MessageStatus
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  failedAt?: string
  failedReason?: string
  metadata?: any
  createdAt: string
}

export interface Conversation {
  id: string
  contactId: string
  instanceId: string
  conversationId?: string
  type: ConversationType
  status: ConversationStatus
  windowStart: string
  windowEnd: string
  lastMessageAt?: string
  messageCount: number
  isWindowActive: boolean
  timeUntilWindowExpires: number
  createdAt: string
  contact?: { id: string; name: string; phone: string; avatarUrl?: string; status: string; tags?: string[] }
  instance?: { id: string; name: string; displayPhoneNumber?: string; verifiedName?: string }
  messages?: Message[]
  assignedTo?: { id: string; name: string; email: string; avatarUrl?: string } | null
}

export interface ConversationStats {
  period: string
  totalCount: number
  activeCount: number
  expiredCount: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  withMessages: number
  totalMessages: number
  avgMessagesPerConversation: number
  engagementRate: number
}

interface CreateConversationRequest {
  contactId: string
  instanceId: string
  type?: ConversationType
}

interface UpdateConversationRequest {
  status?: ConversationStatus
  type?: ConversationType
}

interface SendMessageRequest {
  content: string
  type?: MessageType
  mediaUrl?: string
  caption?: string
  templateId?: string
  metadata?: any
}

interface UseConversationsOptions {
  contactId?: string
  instanceId?: string
  status?: ConversationStatus
  type?: ConversationType
  active?: boolean
  limit?: number
  offset?: number
  assignedTo?: 'me' | 'unassigned' | string  // 'me', 'unassigned', ou userId específico
}

interface UseConversationsReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
  createConversation: (data: CreateConversationRequest) => Promise<Conversation | null>
  updateConversation: (id: string, data: UpdateConversationRequest) => Promise<Conversation | null>
  deleteConversation: (id: string) => Promise<boolean>
  getMessages: (conversationId: string, limit?: number, before?: string) => Promise<Message[] | null>
  sendMessage: (conversationId: string, data: SendMessageRequest) => Promise<Message | null>
  getStats: (period?: string) => Promise<ConversationStats | null>
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao carregar dados')
  }
  
  return data
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const orgId = useOrganizationId()
  const [isMutating, setIsMutating] = useState(false)

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (orgId) params.append('organizationId', orgId)
    if (options.contactId) params.append('contactId', options.contactId)
    if (options.instanceId) params.append('instanceId', options.instanceId)
    if (options.status) params.append('status', options.status)
    if (options.type) params.append('type', options.type)
    if (options.active !== undefined) params.append('active', options.active.toString())
    if (options.assignedTo) params.append('assignedTo', options.assignedTo)
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    return params.toString()
  }, [orgId, options])

  const { data, error, isLoading, mutate: swrMutate } = useSWR(
    orgId ? `/api/conversations?${buildQueryString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Atualiza lista a cada 30 segundos
    }
  )

  const mutate = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  const createConversation = useCallback(async (
    conversationData: CreateConversationRequest
  ): Promise<Conversation | null> => {
    if (!orgId) {
      toast.error('Organização não identificada')
      return null
    }

    setIsMutating(true)
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversationData,
          organizationId: orgId,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar conversa')
      }

      toast.success('Conversa criada com sucesso!')
      await mutate()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conversa'
      toast.error(`Erro: ${message}`)
      return null
    } finally {
      setIsMutating(false)
    }
  }, [orgId, mutate])

  const updateConversation = useCallback(async (
    id: string,
    conversationData: UpdateConversationRequest
  ): Promise<Conversation | null> => {
    setIsMutating(true)
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar conversa')
      }

      toast.success('Conversa atualizada com sucesso!')
      
      // Revalidate specific conversation and list
      await globalMutate(`/api/conversations/${id}`)
      await mutate()
      
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar conversa'
      toast.error(`Erro: ${message}`)
      return null
    } finally {
      setIsMutating(false)
    }
  }, [mutate])

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true)
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao excluir conversa')
      }

      toast.success('Conversa excluída com sucesso!')
      await mutate()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir conversa'
      toast.error(`Erro: ${message}`)
      return false
    } finally {
      setIsMutating(false)
    }
  }, [mutate])

  const getMessages = useCallback(async (
    conversationId: string,
    limit?: number,
    before?: string
  ): Promise<Message[] | null> => {
    try {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (before) params.append('before', before)

      const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar mensagens')
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mensagens'
      toast.error(`Erro: ${message}`)
      return null
    }
  }, [])

  const sendMessage = useCallback(async (
    conversationId: string,
    messageData: SendMessageRequest
  ): Promise<Message | null> => {
    setIsMutating(true)
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      contactId: '',
      direction: 'OUTBOUND',
      type: messageData.type || 'TEXT',
      content: messageData.content,
      mediaUrl: messageData.mediaUrl,
      caption: messageData.caption,
      templateId: messageData.templateId,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    const conversationKey = `/api/conversations/${conversationId}`
    await globalMutate(
      conversationKey,
      async (currentData: any) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          data: {
            ...currentData.data,
            messages: [...(currentData.data.messages || []), optimisticMessage],
          },
        }
      },
      { revalidate: false }
    )

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem')
      }

      // Update with real message data
      await globalMutate(conversationKey)
      await mutate()
      
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      toast.error(`Erro: ${message}`)
      
      // Rollback optimistic update
      await globalMutate(conversationKey)
      
      return null
    } finally {
      setIsMutating(false)
    }
  }, [mutate])

  const getStats = useCallback(async (period?: string): Promise<ConversationStats | null> => {
    if (!orgId) {
      toast.error('Organização não identificada')
      return null
    }

    try {
      const params = new URLSearchParams()
      params.append('organizationId', orgId)
      if (period) params.append('period', period)

      const response = await fetch(`/api/conversations/stats?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar estatísticas')
      }

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
      toast.error(`Erro: ${message}`)
      return null
    }
  }, [orgId])

  return {
    conversations: data?.data || [],
    isLoading: isLoading || isMutating,
    error: error || null,
    mutate,
    createConversation,
    updateConversation,
    deleteConversation,
    getMessages,
    sendMessage,
    getStats,
  }
}

// Hook for single conversation with messages
interface UseConversationOptions {
  messagesLimit?: number
}

interface UseConversationReturn {
  conversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  error: Error | null
  mutate: () => Promise<void>
  sendMessage: (data: SendMessageRequest) => Promise<Message | null>
  loadMoreMessages: (before: string) => Promise<Message[] | null>
}

export function useConversation(
  id: string | null,
  options: UseConversationOptions = {}
): UseConversationReturn {
  const orgId = useOrganizationId()
  const [isMutating, setIsMutating] = useState(false)

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (options.messagesLimit) {
      params.append('messagesLimit', options.messagesLimit.toString())
    }
    return params.toString()
  }, [options.messagesLimit])

  const { data, error, isLoading, mutate: swrMutate } = useSWR(
    id ? `/api/conversations/${id}?${buildQueryString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Backup poll — SSE cuida do tempo real
    }
  )

  const mutate = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  const sendMessage = useCallback(async (
    messageData: SendMessageRequest
  ): Promise<Message | null> => {
    if (!id) return null

    setIsMutating(true)
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: id,
      contactId: '',
      direction: 'OUTBOUND',
      type: messageData.type || 'TEXT',
      content: messageData.content,
      mediaUrl: messageData.mediaUrl,
      caption: messageData.caption,
      templateId: messageData.templateId,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    await swrMutate(
      async (currentData: any) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          data: {
            ...currentData.data,
            messages: [...(currentData.data.messages || []), optimisticMessage],
            lastMessageAt: new Date().toISOString(),
            messageCount: (currentData.data.messageCount || 0) + 1,
          },
        }
      },
      { revalidate: false }
    )

    try {
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem')
      }

      // Revalidate to get real data
      await swrMutate()
      
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      toast.error(`Erro: ${message}`)
      
      // Rollback
      await swrMutate()
      
      return null
    } finally {
      setIsMutating(false)
    }
  }, [id, swrMutate])

  const loadMoreMessages = useCallback(async (before: string): Promise<Message[] | null> => {
    if (!id) return null

    try {
      const params = new URLSearchParams()
      params.append('limit', '50')
      params.append('before', before)

      const response = await fetch(`/api/conversations/${id}/messages?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao carregar mensagens')
      }

      // Prepend messages to existing list
      await swrMutate(
        async (currentData: any) => {
          if (!currentData) return currentData
          const newMessages = result.data || []
          return {
            ...currentData,
            data: {
              ...currentData.data,
              messages: [...newMessages, ...(currentData.data.messages || [])],
            },
          }
        },
        { revalidate: false }
      )

      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mensagens'
      toast.error(`Erro: ${message}`)
      return null
    }
  }, [id, swrMutate])

  const conversation = data?.data || null
  const messages = conversation?.messages || []

  return {
    conversation,
    messages,
    isLoading,
    isSending: isMutating,
    error: error || null,
    mutate,
    sendMessage,
    loadMoreMessages,
  }
}
