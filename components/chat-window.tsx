"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Phone, MoreHorizontal, Clock, Tag, AlertCircle, Star, Loader2, X, Plus } from "lucide-react"
import { cn, formatRelativeDate } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AssignConversationDialog } from "@/components/conversations/assign-conversation-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useConversation } from "@/hooks/use-conversations"
import { useConversationStream } from "@/hooks/use-conversation-stream"
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
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [contactTags, setContactTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  
  // Busca mensagens reais da API
  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    conversation: convData
  } = useConversation(conversation?.id || null, {
    messagesLimit: 100
  })

  // Stream SSE para mensagens em tempo real e indicador de digitação
  const { isTyping } = useConversationStream(conversation?.id || null)

  // Scroll para o final apenas quando uma nova mensagem é adicionada
  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lastMessageId])

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

  // Handlers de tags
  const handleTagPopoverOpen = async (open: boolean) => {
    setTagPopoverOpen(open)
    if (open && conversation?.contactId) {
      setTagsLoading(true)
      try {
        const [allTagsRes, contactTagsRes] = await Promise.all([
          fetch('/api/tags?limit=100'),
          fetch(`/api/contacts/${conversation.contactId}/tags`),
        ])
        const allTagsData = await allTagsRes.json()
        const contactTagsData = await contactTagsRes.json()
        if (allTagsData.success) setAvailableTags(allTagsData.data)
        if (contactTagsData.success) setContactTags(contactTagsData.data)
      } catch {
        toast.error('Erro ao carregar tags')
      } finally {
        setTagsLoading(false)
      }
    }
  }

  const handleAddTag = async (tagId: string) => {
    if (!conversation?.contactId) return
    const res = await fetch(`/api/contacts/${conversation.contactId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    const data = await res.json()
    if (data.success) {
      const tag = availableTags.find((t) => t.id === tagId)
      if (tag) setContactTags((prev) => [...prev, tag])
    } else {
      toast.error(data.error || 'Erro ao adicionar tag')
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!conversation?.contactId) return
    const res = await fetch(`/api/contacts/${conversation.contactId}/tags/${tagId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.success) {
      setContactTags((prev) => prev.filter((t) => t.id !== tagId))
    } else {
      toast.error(data.error || 'Erro ao remover tag')
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
    from: msg.direction === 'OUTBOUND' ? 'user' : 'agent' as 'agent' | 'user' | 'bot',
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
          <Popover open={tagPopoverOpen} onOpenChange={handleTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-xs font-semibold text-foreground mb-2">Tags do contato</p>
              {tagsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {contactTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {contactTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="flex items-center gap-1 bg-[#46347F]/10 text-[#46347F] rounded px-2 py-0.5 text-xs font-medium"
                        >
                          {tag.name}
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={contactTags.length > 0 ? "border-t pt-2" : ""}>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Adicionar tag</p>
                    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                      {availableTags.filter((t) => !contactTags.some((ct) => ct.id === t.id)).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Todas as tags já foram adicionadas
                        </p>
                      ) : (
                        availableTags
                          .filter((t) => !contactTags.some((ct) => ct.id === t.id))
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              className="flex items-center gap-2 text-xs text-left px-2 py-1 rounded hover:bg-muted text-foreground transition-colors"
                            >
                              <Plus className="h-3 w-3 text-muted-foreground" />
                              {tag.name}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
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
        {isLoading && messages.length === 0 ? (
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
                      "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
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
            {/* Indicador de digitação */}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#46347F]/20 text-[#46347F]">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-[#F3F2F2] px-4 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
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
            disabled={isSending}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-2",
              input.trim() && !isSending
                ? "bg-[#46347F] text-white hover:bg-[#3a2c6b]"
                : "cursor-not-allowed text-muted-foreground bg-gray-100"
            )}
          >
            {isSending ? (
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
