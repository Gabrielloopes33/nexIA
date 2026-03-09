"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  MessageCircle, 
  Send, 
  User,
  AtSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  contact: {
    id: string
    name: string
    username: string
    profilePicture?: string
  }
  lastMessage?: {
    content: string
    direction: "INBOUND" | "OUTBOUND"
    sentAt: Date
    status: "SENT" | "DELIVERED" | "READ" | "FAILED"
  }
  unreadCount?: number
}

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: "1",
    contact: {
      id: "c1",
      name: "Maria Silva",
      username: "mariasilva",
    },
    lastMessage: {
      content: "Obrigada pela informação!",
      direction: "INBOUND",
      sentAt: new Date(Date.now() - 1000 * 60 * 5),
      status: "READ",
    },
    unreadCount: 0,
  },
  {
    id: "2",
    contact: {
      id: "c2",
      name: "João Santos",
      username: "joaosantos",
    },
    lastMessage: {
      content: "Você: Temos uma promoção especial este mês",
      direction: "OUTBOUND",
      sentAt: new Date(Date.now() - 1000 * 60 * 30),
      status: "DELIVERED",
    },
    unreadCount: 0,
  },
  {
    id: "3",
    contact: {
      id: "c3",
      name: "Ana Paula",
      username: "anapaula",
    },
    lastMessage: {
      content: "Gostaria de saber mais sobre os serviços",
      direction: "INBOUND",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "READ",
    },
    unreadCount: 2,
  },
]

interface InstagramDirectSectionProps {
  instance: {
    id: string
    username: string
    profilePictureUrl?: string | null
  } | null
  onSendMessage: (recipient: string, message: string) => Promise<void>
}

export function InstagramDirectSection({
  instance,
  onSendMessage,
}: InstagramDirectSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [recipient, setRecipient] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeView, setActiveView] = useState<"list" | "new">("list")

  const filteredConversations = mockConversations.filter((conv) =>
    conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = mockConversations.find((c) => c.id === selectedConversation)

  const handleSendMessage = async () => {
    if (activeView === "new") {
      if (!recipient.trim() || !messageText.trim()) return
      setIsSending(true)
      try {
        await onSendMessage(recipient.trim(), messageText.trim())
        setRecipient("")
        setMessageText("")
        setActiveView("list")
      } finally {
        setIsSending(false)
      }
    } else {
      if (!selectedConversation || !messageText.trim()) return
      setIsSending(true)
      try {
        await onSendMessage(selectedConv?.contact.username || "", messageText.trim())
        setMessageText("")
      } finally {
        setIsSending(false)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READ":
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />
      case "DELIVERED":
        return <CheckCircle2 className="h-3 w-3 text-gray-400" />
      case "FAILED":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  if (!instance) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma conta selecionada</h3>
          <p className="text-muted-foreground text-center max-w-md mt-1">
            Selecione uma conta Instagram para gerenciar mensagens Direct
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Message Card */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]">
                <Send className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Enviar Mensagem Direct</CardTitle>
                <CardDescription>
                  Envie mensagens diretamente para usuários do Instagram
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AtSign className="h-3.5 w-3.5" />
                Destinatário
              </label>
              <Input
                placeholder="@username"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                De
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={instance.profilePictureUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-[8px] text-white">
                    {instance.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">@{instance.username}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              Mensagem
            </label>
            <Textarea
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !recipient.trim() || !messageText.trim()}
              className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90"
            >
              {isSending ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Conversas Recentes</CardTitle>
                <CardDescription>
                  {mockConversations.length} conversas encontradas
                </CardDescription>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors text-left",
                    selectedConversation === conv.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-12 w-12">
                    {conv.contact.profilePicture ? (
                      <AvatarFallback className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white">
                        {conv.contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white">
                        {conv.contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{conv.contact.name}</p>
                      <div className="flex items-center gap-2">
                        {conv.unreadCount ? (
                          <Badge className="bg-[#FD1D1D] text-white">{conv.unreadCount}</Badge>
                        ) : null}
                        {conv.lastMessage && getStatusIcon(conv.lastMessage.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.direction === "OUTBOUND" ? "Você: " : ""}
                      {conv.lastMessage?.content || "Sem mensagens"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        @{conv.contact.username}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessage?.sentAt && formatDistanceToNow(conv.lastMessage.sentAt)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
