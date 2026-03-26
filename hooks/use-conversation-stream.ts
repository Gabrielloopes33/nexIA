"use client"

import { useEffect, useRef, useState } from 'react'
import { mutate as globalMutate } from 'swr'

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

      es.addEventListener('messages', () => {
        // Invalida o cache SWR → re-fetch imediato das mensagens
        globalMutate(conversationKey)
        // Também atualiza a lista de conversas
        globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/conversations?'), undefined, { revalidate: true })
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
