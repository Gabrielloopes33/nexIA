"use client"

import { useState } from "react"
import { Send, Bot, User, Phone, MoreHorizontal, Clock, Tag, UserPlus, AlertCircle, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/types/conversation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const mockMessages: Record<string, { id: string; from: "user" | "agent" | "bot"; text: string; time: string }[]> = {
  "1": [
    { id: "m1", from: "user", text: "Oi, preciso de ajuda com meu pedido", time: "14:30" },
    { id: "m2", from: "bot", text: "Olá! Sou o assistente da NexIA. Como posso te ajudar com seu pedido?", time: "14:30" },
    { id: "m3", from: "user", text: "O pedido #1234 não chegou ainda", time: "14:31" },
    { id: "m4", from: "bot", text: "Vou verificar o status do seu pedido #1234. Um momento por favor.", time: "14:32" },
  ],
  "2": [
    { id: "m1", from: "user", text: "Quando chega o meu produto?", time: "13:08" },
    { id: "m2", from: "bot", text: "Olá! Pode me informar o número do pedido para eu verificar?", time: "13:09" },
    { id: "m3", from: "user", text: "É o pedido #5678", time: "13:10" },
  ],
  "3": [
    { id: "m1", from: "user", text: "Oi, quero cancelar meu pedido", time: "11:40" },
    { id: "m2", from: "bot", text: "Entendo. Posso verificar qual pedido você deseja cancelar?", time: "11:41" },
    { id: "m3", from: "user", text: "Obrigada pelo atendimento!", time: "11:45" },
    { id: "m4", from: "agent", text: "Fico feliz em poder ajudar! Qualquer dúvida estamos à disposição.", time: "11:45" },
  ],
  "4": [
    { id: "m1", from: "user", text: "Gostaria de saber mais sobre os planos", time: "10:18" },
    { id: "m2", from: "bot", text: "Claro! Temos três planos: Básico, Pro e Enterprise. Qual deles te interessa?", time: "10:19" },
    { id: "m3", from: "user", text: "Me fala mais sobre o Pro", time: "10:20" },
  ],
}

const contactNames: Record<string, string> = {
  "1": "Maria Silva",
  "2": "Joao Pereira",
  "3": "Ana Costa",
  "4": "Carlos Mendes",
}

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

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background border-l border-border">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9795e4]/10">
          <Bot className="h-8 w-8 text-[#9795e4]" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">Selecione uma conversa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma conversa no painel ao lado para começar
        </p>
      </div>
    )
  }

  const messages = mockMessages[conversation.id] ?? []
  const statusConfig = STATUS_CONFIG[conversation.status]
  const priorityConfig = PRIORITY_CONFIG[conversation.priority]

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
                <p className="text-xs text-[#9795e4] flex items-center gap-1">
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <UserPlus className="h-4 w-4" />
          </Button>
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
        {messages.map((msg) => {
          const isUser = msg.from === "user"
          return (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser && (
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    msg.from === "bot"
                      ? "bg-[#9795e4]/10 text-[#9795e4]"
                      : "bg-[#b3b3e5]/20 text-[#7c7ab8]"
                  )}
                >
                  {msg.from === "bot" ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-[#9795e4] text-white"
                    : "rounded-bl-sm bg-[#F3F2F2] text-foreground"
                )}
              >
                {msg.text}
                <p
                  className={cn(
                    "mt-1 text-right text-[10px]",
                    isUser ? "text-white/60" : "text-muted-foreground"
                  )}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#7C3AED]/30">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enviar intervencao humana..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                setInput("")
              }
            }}
          />
          <button
            onClick={() => setInput("")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              input.trim()
                ? "bg-[#9795e4] text-white hover:bg-[#7c7ab8]"
                : "cursor-default text-muted-foreground"
            )}
          >
            <span className="hidden sm:inline">Enviar</span>
            <Send className="h-3.5 w-3.5 sm:hidden" />
          </button>
        </div>
      </div>
    </div>
  )
}
