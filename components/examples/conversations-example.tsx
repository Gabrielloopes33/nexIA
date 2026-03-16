'use client'

import { useConversations, useConversation } from '@/hooks/use-conversations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Phone, Clock, MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { formatDistanceToNow } from '@/lib/utils'

// Lista de conversas
export function ConversationsListExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const {
    conversations,
    isLoading,
    error,
  } = useConversations({
    active: true,  // Só conversas com janela ativa
    limit: 20,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600">Erro: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversas Ativas
          <Badge variant="secondary">{conversations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === conv.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {conv.contact?.name || conv.contact?.phone}
                  </span>
                  {conv.isWindowActive ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(conv.timeUntilWindowExpires / 1000 / 60)}min
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Expirada</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {conv.messages?.[0]?.content || 'Sem mensagens'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{conv.messageCount} mensagens</span>
                  <span>•</span>
                  <span>{conv.instance?.name}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      {selectedId && (
        <ConversationChat conversationId={selectedId} />
      )}
    </Card>
  )
}

// Chat de uma conversa específica
function ConversationChat({ conversationId }: { conversationId: string }) {
  const [newMessage, setNewMessage] = useState('')
  
  const {
    conversation,
    messages,
    isLoading,
    sendMessage,
  } = useConversation(conversationId, {
    messagesLimit: 50,
  })

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await sendMessage({
      content: newMessage,
      type: 'TEXT',
    })
    setNewMessage('')
  }

  return (
    <Card className="mt-4 border-t">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="h-4 w-4" />
          {conversation?.contact?.name || 'Chat'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] mb-4">
          <div className="space-y-4">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatDistanceToNow(new Date(msg.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={!conversation?.isWindowActive}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!conversation?.isWindowActive}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {!conversation?.isWindowActive && (
          <p className="text-xs text-destructive mt-2">
            Janela de 24h expirada. Use um template para reabrir.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
