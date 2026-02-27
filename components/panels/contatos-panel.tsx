'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Tag, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContactFilter = 'todos' | 'lead' | 'cliente' | 'inativo'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  status: 'lead' | 'cliente' | 'inativo'
  tags: string[]
}

// Mock data
const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'João Silva', email: 'joao@empresa.com', phone: '(11) 99999-0001', status: 'lead', tags: ['Interessado', 'B2B'] },
  { id: '2', name: 'Maria Santos', email: 'maria@gmail.com', phone: '(11) 99999-0002', status: 'cliente', tags: ['Premium', 'B2C'] },
  { id: '3', name: 'Pedro Oliveira', email: 'pedro@startup.io', phone: '(21) 99999-0003', status: 'lead', tags: ['Startup'] },
  { id: '4', name: 'Ana Costa', email: 'ana@tech.com', phone: '(31) 99999-0004', status: 'cliente', tags: ['B2B', 'Recorrente'] },
  { id: '5', name: 'Carlos Ferreira', email: 'carlos@gmail.com', phone: '(48) 99999-0005', status: 'inativo', tags: [] },
  { id: '6', name: 'Juliana Lima', email: 'ju@empresa.co', phone: '(85) 99999-0006', status: 'lead', tags: ['Negociação'] },
  { id: '7', name: 'Roberto Alves', email: 'roberto@corp.com', phone: '(11) 99999-0007', status: 'cliente', tags: ['Enterprise', 'B2B'] },
]

export function ContatosPanel() {
  const [filter, setFilter] = useState<ContactFilter>('todos')

  const filteredContacts = filter === 'todos' 
    ? MOCK_CONTACTS 
    : MOCK_CONTACTS.filter(c => c.status === filter)

  const leadsCount = MOCK_CONTACTS.filter(c => c.status === 'lead').length
  const clientesCount = MOCK_CONTACTS.filter(c => c.status === 'cliente').length
  const inativosCount = MOCK_CONTACTS.filter(c => c.status === 'inativo').length

  return (
    <div className="flex flex-col h-full">
      {/* Filtros por Status */}
      <div className="flex flex-col gap-1.5 border-b-2 border-border p-2">
        <Button
          variant={filter === 'todos' ? 'default' : 'ghost'}
          onClick={() => setFilter('todos')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'todos' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Users className="mr-2 h-3.5 w-3.5" />
          Todos
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {MOCK_CONTACTS.length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'lead' ? 'default' : 'ghost'}
          onClick={() => setFilter('lead')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'lead' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Tag className="mr-2 h-3.5 w-3.5" />
          Leads
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {leadsCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'cliente' ? 'default' : 'ghost'}
          onClick={() => setFilter('cliente')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'cliente' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Mail className="mr-2 h-3.5 w-3.5" />
          Clientes
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {clientesCount}
          </Badge>
        </Button>
        <Button
          variant={filter === 'inativo' ? 'default' : 'ghost'}
          onClick={() => setFilter('inativo')}
          size="sm"
          className={cn(
            'justify-start h-8 text-xs',
            filter === 'inativo' && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
          )}
        >
          <Phone className="mr-2 h-3.5 w-3.5" />
          Inativos
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {inativosCount}
          </Badge>
        </Button>
      </div>

      {/* Lista de Contatos */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              className="w-full text-left rounded-sm border border-border p-2.5 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-foreground">
                  {contact.name}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-[8px] h-4 px-1.5',
                    contact.status === 'lead' && 'border-[#FFAB00] text-[#FFAB00]',
                    contact.status === 'cliente' && 'border-[#027E46] text-[#027E46]',
                    contact.status === 'inativo' && 'border-muted-foreground text-muted-foreground'
                  )}
                >
                  {contact.status}
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground mb-0.5">
                {contact.email}
              </p>
              <p className="text-[9px] text-muted-foreground mb-1">
                {contact.phone}
              </p>
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[8px] h-4 px-1.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer com Totais */}
      <div className="border-t-2 border-border p-2">
        <div className="text-[9px] text-muted-foreground text-center">
          {filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
