'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConversationStatus = 'ativa' | 'arquivada' | 'todas'

interface Conversation {
  id: string
  contactName: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  status: 'ativa' | 'arquivada'
}

// Mock data
const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', contactName: 'João Silva', lastMessage: 'Obrigado pela informação!', timestamp: '2 min', unreadCount: 2, status: 'ativa' },
  { id: '2', contactName: 'Maria Santos', lastMessage: 'Quando podemos agendar?', timestamp: '15 min', unreadCount: 1, status: 'ativa' },
  { id: '3', contactName: 'Pedro Oliveira', lastMessage: 'Perfeito, vou verificar...', timestamp: '1h', unreadCount: 0, status: 'ativa' },
  { id: '4', contactName: 'Ana Costa', lastMessage: 'Recebi o orçamento, obrigada', timestamp: '3h', unreadCount: 3, status: 'ativa' },
  { id: '5', contactName: 'Carlos Ferreira', lastMessage: 'Vou analisar e retorno', timestamp: '5h', unreadCount: 0, status: 'ativa' },
  { id: '6', contactName: 'Juliana Lima', lastMessage: 'Fechado! Vamos em frente', timestamp: 'Ontem', unreadCount: 0, status: 'arquivada' },
  { id: '7', contactName: 'Roberto Alves', lastMessage: 'Preciso de mais detalhes', timestamp: 'Ontem', unreadCount: 0, status: 'ativa' },
]

export function ConversasPanel() {
  const [filterStatus, setFilterStatus] = useState<ConversationStatus>('todas')

  const filteredConversations = filterStatus === 'todas' 
    ? MOCK_CONVERSATIONS 
    : MOCK_CONVERSATIONS.filter(c => c.status === filterStatus)

  const activeCount = MOCK_CONVERSATIONS.filter(c => c.status === 'ativa').length
  const arquivadasCount = MOCK_CONVERSATIONS.filter(c => c.status === 'arquivada').length

  return (
    <div className="flex flex-col h-full">
      {/* Filtros */}
      <div className="flex flex-col gap-1.5 border-b-2 border-border p-2">
        <Button
          variant={filterStatus === 'todas' ? 'default' : 'ghost'}
          onClick={() => setFilterStatus('todas')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filterStatus === 'todas' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <MessageSquare className="mr-2 h-3.5 w-3.5" />
          Todas
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {MOCK_CONVERSATIONS.length}
          </Badge>
        </Button>
        <Button
          variant={filterStatus === 'ativa' ? 'default' : 'ghost'}
          onClick={() => setFilterStatus('ativa')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filterStatus === 'ativa' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <User className="mr-2 h-3.5 w-3.5" />
          Ativas
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {activeCount}
          </Badge>
        </Button>
        <Button
          variant={filterStatus === 'arquivada' ? 'default' : 'ghost'}
          onClick={() => setFilterStatus('arquivada')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filterStatus === 'arquivada' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Clock className="mr-2 h-3.5 w-3.5" />
          Arquivadas
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {arquivadasCount}
          </Badge>
        </Button>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              className="w-full text-left rounded-sm border border-border p-2.5 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-foreground">
                  {conversation.contactName}
                </span>
                <div className="flex items-center gap-1">
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-[#9795e4] text-white text-[8px] h-4 px-1.5">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {conversation.timestamp}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {conversation.lastMessage}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer com Totais */}
      <div className="border-t-2 border-border p-2">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
          <span>{filteredConversations.length} conversa{filteredConversations.length !== 1 ? 's' : ''}</span>
          <span>{MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0)} não lida{MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0) !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
