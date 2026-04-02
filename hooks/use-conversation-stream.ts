"use client"

import { useEffect, useRef, useState } from 'react'
import { mutate as globalMutate } from 'swr'
import { playMessageSound } from '@/lib/sounds'

interface StreamState {
  isTyping: boolean
  typingPhone: string | null
  connected: boolean
}

/**
 * Abre uma conexão SSE com /api/conversations/[id]/stream.
 * Ao receber novas mensagens, invalida o cache SWR da conversa.
 * Expõe o estado de digitação do contato.
 */
export function useConversationStream(id: string | null) {
  const [state, setState] = useState<StreamState>({
    isTyping: false,
    typingPhone: null,
    connected: false,
  })
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!id) return

    const conversationKey = `/api/conversations/${id}?messagesLimit=100`

    const connect = () => {
      const es = new EventSource(`/api/conversations/${id}/stream`)
      esRef.current = es

      es.addEventListener('connected', () => {
        setState(s => ({ ...s, connected: true }))
      })

      es.addEventListener('messages', (e: MessageEvent) => {
        const { messages: newMsgs } = JSON.parse(e.data)
        if (!newMsgs?.length) return

        // Toca som de notificação para mensagens novas
        playMessageSound()

        // Atualiza o cache SWR diretamente — sem re-fetch, sem flicker
        globalMutate(
          conversationKey,
          (current: any) => {
            if (!current?.data) return current
            const existing: any[] = current.data.messages || []
            const existingIds = new Set(existing.map((m: any) => m.id))
            const toAdd = newMsgs.filter((m: any) => !existingIds.has(m.id))
            if (toAdd.length === 0) return current
            return {
              ...current,
              data: {
                ...current.data,
                messages: [...existing, ...toAdd],
                messageCount: (current.data.messageCount || 0) + toAdd.length,
                lastMessageAt: toAdd[toAdd.length - 1].createdAt,
              },
            }
          },
          { revalidate: false } // não faz re-fetch
        )
      })

      es.addEventListener('typing', (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        setState(s => ({ ...s, isTyping: data.isTyping, typingPhone: data.phone }))
      })

      es.onerror = () => {
        setState(s => ({ ...s, connected: false }))
        // EventSource reconecta automaticamente — apenas loga
        console.debug('[SSE] Reconnecting...')
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      esRef.current = null
      setState({ isTyping: false, typingPhone: null, connected: false })
    }
  }, [id])

  return state
}
