"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Phone, MoreHorizontal, Clock, Tag, AlertCircle, Star, Loader2 } from "lucide-react"
import { cn, formatRelativeDate } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AssignConversationDialog } from "@/components/conversations/assign-conversation-dialog"
import { useConversation } from "@/hooks/use-conversations"
import { toast } from "sonner"

const STATUS_CONFIG = {
  open: { label: "Aberto", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  solved: { label: "Resolvido", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  closed: { label: "Fechado", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
}

const PRIORITY_CONFIG = {
  low: { label: "Baixa", color: "text-gray-500" },
  medium: { label: "Média", color: "text-blue-500" },
  high: { label: "Alta", color: "text-orange-500" },
  urgent: { label: "Urgente", color: "text-red-500" },
}

interface Props {
  conversation: Conversation | null
}

export function ChatWindow({ conversation }: Props) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Busca mensagens reais da API
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage,
    conversation: convData 
  } = useConversation(conversation?.id || null, {
    messagesLimit: 100
  })

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mostra erro se houver
  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar mensagens", {
        description: error.message
      })
    }
  }, [error])

  // Handler para enviar mensagem
  const handleSend = async () => {
    if (!input.trim() || !conversation) return

    const content = input.trim()
    setInput("")

    const success = await sendMessage({ content })
    
    if (!success) {
      toast.error("Erro ao enviar mensagem")
    }
  }

  // Handler para tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background border-l border-border">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#46347F]/10">
          <Bot className="h-8 w-8 text-[#46347F]" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">Selecione uma conversa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma conversa no painel ao lado para começar
        </p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[conversation.status]
  const priorityConfig = PRIORITY_CONFIG[conversation.priority]

  // Mapeia mensagens da API para o formato do componente
  const mappedMessages = messages.map((msg) => ({
    id: msg.id,
    from: msg.direction === 'OUTBOUND' ? 'agent' : 'user' as 'agent' | 'user' | 'bot',
    text: msg.content,
    time: new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: msg.status,
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            {conversation.contactAvatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{conversation.contactName}</p>
              {conversation.starred && (
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {conversation.contactCompany && (
                <p className="text-xs text-muted-foreground truncate">{conversation.contactCompany}</p>
              )}
              {conversation.assignedTo ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>•</span>
                  Atribuído a {conversation.assignedTo.name}
                </p>
              ) : (
                <p className="text-xs text-[#46347F] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Não atribuído
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <Badge variant="outline" className={cn("text-[10px] font-semibold", statusConfig.className)}>
            {statusConfig.label}
          </Badge>

          {/* Priority Badge */}
          <Badge variant="outline" className="text-[10px] font-semibold flex items-center gap-1">
            <div className={cn("h-1.5 w-1.5 rounded-full", priorityConfig.color.replace("text-", "bg-"))} />
            {priorityConfig.label}
          </Badge>

          {/* SLA Indicator */}
          {conversation.slaStatus === "breach" && (
            <Badge variant="outline" className="text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              SLA Vencido
            </Badge>
          )}
          {conversation.slaStatus === "warning" && (
            <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Clock className="h-3 w-3 mr-1" />
              SLA em Risco
            </Badge>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          {/* Action Buttons */}
          <AssignConversationDialog
            conversationId={conversation.id}
            currentAssignee={conversation.assignedTo}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Tag className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
          </div>
        ) : mappedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">Inicie a conversa enviando uma mensagem</p>
          </div>
        ) : (
          <>
            {mappedMessages.map((msg) => {
              const isUser = msg.from === "user"
              const isAgent = msg.from === "agent"
              return (
                <div
                  key={msg.id}
                  className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isAgent
                          ? "bg-[#46347F]/20 text-[#46347F]"
                          : "bg-[#46347F]/10 text-[#46347F]"
                      )}
                    >
                      {isAgent ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "rounded-br-sm bg-[#46347F] text-white"
                        : "rounded-bl-sm bg-[#F3F2F2] text-foreground"
                    )}
                  >
                    {msg.text}
                    <div className={cn(
                      "mt-1 flex items-center gap-1",
                      isUser ? "justify-end" : "justify-start"
                    )}>
                      <p
                        className={cn(
                          "text-[10px]",
                          isUser ? "text-white/60" : "text-muted-foreground"
                        )}
                      >
                        {msg.time}
                      </p>
                      {isUser && msg.status && (
                        <span className={cn(
                          "text-[10px]",
                          isUser ? "text-white/60" : "text-muted-foreground"
                        )}>
                          {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#7C3AED]/30">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-2",
              input.trim() && !isLoading
                ? "bg-[#46347F] text-white hover:bg-[#3a2c6b]"
                : "cursor-not-allowed text-muted-foreground bg-gray-100"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Enviar</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
