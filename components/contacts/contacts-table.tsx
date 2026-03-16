"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Phone, Edit, Trash2, Eye } from "lucide-react"
import { Contact } from "@/hooks/use-contacts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ContactsTableProps {
  contacts: Contact[]
  selectedContacts: string[]
  onSelectContact: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onViewContact: (contact: Contact) => void
  onEditContact: (contact: Contact) => void
  onDeleteContact: (contact: Contact) => void
}

const CONTACT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo', color: '#10b981' },
  { value: 'INACTIVE', label: 'Inativo', color: '#6b7280' },
  { value: 'BLOCKED', label: 'Bloqueado', color: '#ef4444' },
]

// Helper to get display name
const getDisplayName = (contact: Contact): string => {
  return contact.name || contact.phone || 'Sem nome'
}

// Helper to get initials
const getInitials = (contact: Contact): string => {
  const name = contact.name || contact.phone || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusColor(status: Contact["status"]): string {
  const option = CONTACT_STATUS_OPTIONS.find((o) => o.value === status)
  return option?.color || "#46347F"
}

function getStatusLabel(status: Contact["status"]): string {
  const option = CONTACT_STATUS_OPTIONS.find((o) => o.value === status)
  return option?.label || status
}

export function ContactsTable({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onViewContact,
  onEditContact,
  onDeleteContact,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length

  return (
    <div className="rounded-sm border border-border bg-white flex-1 min-h-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="w-[250px]">Contato</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Status</TableHead>

            <TableHead>Origem</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                Nenhum contato encontrado
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => {
              const isSelected = selectedContacts.includes(contact.id)

              return (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewContact(contact)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelectContact(contact.id, checked as boolean)
                      }
                      aria-label={`Selecionar ${getDisplayName(contact)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-9 w-9"
                        style={{ backgroundColor: '#46347F' }}
                      >
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {getDisplayName(contact)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(contact.metadata?.email as string) || contact.phone}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tagId) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                          className="text-xs"
                        >
                          Tag {tagId.slice(0, 4)}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(contact.status) }}
                      />
                      <span className="text-sm">{getStatusLabel(contact.status)}</span>
                    </div>
                  </TableCell>
        
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {(contact.metadata?.source as string) || 'Manual'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {contact.updatedAt ? format(new Date(contact.updatedAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      }) : '-'}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewContact(contact)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditContact(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Ligar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteContact(contact)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
