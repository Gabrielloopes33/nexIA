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
import { MoreHorizontal, Mail, Phone, Edit, Trash2, Eye } from "lucide-react"
import { Contact, getContactTags, CONTACT_STATUS_OPTIONS } from "@/lib/mock/contacts"
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

function getStatusColor(status: Contact["status"]): string {
  const option = CONTACT_STATUS_OPTIONS.find((o) => o.value === status)
  return option?.color || "#9795e4"
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
            <TableHead>Lead Score</TableHead>
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
              const tags = getContactTags(contact)
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
                      aria-label={`Selecionar ${contact.nome}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="h-9 w-9"
                        style={{ backgroundColor: contact.avatarBg }}
                      >
                        <AvatarFallback className="text-xs font-semibold">
                          {contact.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {contact.nome} {contact.sobrenome}
                        </p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          style={{
                            backgroundColor: `${tag.cor}20`,
                            color: tag.cor,
                            borderColor: tag.cor,
                          }}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag.nome}
                        </Badge>
                      ))}
                      {tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tags.length - 2}
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
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#9795e4]"
                          style={{ width: `${Math.min(contact.leadScore, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{contact.leadScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{contact.origem}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(contact.atualizadoEm), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
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
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Email
                        </DropdownMenuItem>
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
