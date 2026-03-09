"use client"

import { useState } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TextMessageTabProps {
  message: string
  onMessageChange: (message: string) => void
  onSend: () => void
  isLoading: boolean
  disabled: boolean
}

const MAX_CHARS = 4096

export function TextMessageTab({
  message,
  onMessageChange,
  onSend,
  isLoading,
  disabled,
}: TextMessageTabProps) {
  const [showPreview, setShowPreview] = useState(true)

  const charCount = message.length
  const isOverLimit = charCount > MAX_CHARS

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e.target.value)
  }

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message-text">Mensagem</Label>
          <span className={cn(
            "text-xs",
            isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"
          )}>
            {charCount} / {MAX_CHARS} caracteres
          </span>
        </div>
        <Textarea
          id="message-text"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={handleChange}
          rows={5}
          className={cn(
            "resize-none",
            isOverLimit && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Suporte a emojis e quebras de linha. Links serão automaticamente destacados.
        </p>
      </div>

      {/* Preview Toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowPreview(!showPreview)}
        className="text-muted-foreground"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {showPreview ? 'Ocultar preview' : 'Mostrar preview'}
      </Button>

      {/* WhatsApp Preview */}
      {showPreview && (
        <Card className="border-[#25D366]/30 bg-[#f0f2f5]">
          <CardContent className="p-4">
            <div className="max-w-[80%] ml-auto">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tr-sm p-3 shadow-sm">
                <p className="text-sm text-[#075E54] whitespace-pre-wrap">
                  {message || 'Sua mensagem aparecerá aqui...'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-[#075E54]/60">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <svg className="w-3 h-3 text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Button */}
      <Button
        onClick={onSend}
        disabled={disabled || isLoading || !message.trim() || isOverLimit}
        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enviar Mensagem
          </>
        )}
      </Button>

      {/* Compliance Notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800">
          <strong>Importante:</strong> Mensagens de texto só podem ser enviadas dentro da janela de 24h 
          após a última interação do cliente. Fora dessa janela, use templates aprovados.
        </p>
      </div>
    </div>
  )
}
