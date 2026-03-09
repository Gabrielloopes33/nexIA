"use client"

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export type MessageType = 'text' | 'template'

export interface SendTextMessageRequest {
  instanceId: string
  to: string
  type: 'text'
  text: string
  previewUrl?: boolean
}

export interface SendTemplateMessageRequest {
  instanceId: string
  to: string
  type: 'template'
  templateName: string
  language: string
  components?: Record<string, unknown>[]
}

export type SendMessageRequest = SendTextMessageRequest | SendTemplateMessageRequest

export interface SendMessageResponse {
  success: boolean
  data?: {
    sent: boolean
    messageId: string
    recipientId: string
    messagingProduct: string
  }
  error?: string
  errorCode?: string
  errorType?: string
}

interface UseSendMessageReturn {
  isLoading: boolean
  error: string | null
  sendMessage: (request: SendMessageRequest) => Promise<SendMessageResponse | null>
}

export function useSendMessage(): UseSendMessageReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    request: SendMessageRequest
  ): Promise<SendMessageResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/whatsapp/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data: SendMessageResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      toast.success('Mensagem enviada com sucesso!')
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      setError(errorMessage)
      toast.error(`Erro: ${errorMessage}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    sendMessage,
  }
}
