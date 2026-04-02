"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { ContactFilters } from "@/components/contacts/contact-filters"
import { CustomerContextPanel } from "@/components/customer-context-panel"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload, UserPlus, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Contact {
  id: string
  organizationId: string
  phone: string
  name?: string | null
  avatarUrl?: string | null
  metadata?: Record<string, unknown> | null
  tags: string[]
  leadScore: number
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  lastInteractionAt?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedTags.length) params.append('tags', selectedTags.join(','))
      if (selectedStatuses.length === 1) params.append('status', selectedStatuses[0])
      
      const response = await fetch(`/api/contacts?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setContacts(data.data || [])
        setTotal(data.pagination?.total || 0)
      } else {
        toast.error(data.error || 'Erro ao carregar contatos')
      }
    } catch (error) {
      toast.error('Erro ao carregar contatos')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedTags, selectedStatuses])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleSelectContact = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts([...selectedContacts, id])
    } else {
      setSelectedContacts(selectedContacts.filter((c) => c !== id))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(contacts.map((c) => c.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsPanelOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsEditDialogOpen(true)
  }

  const handleSaveContact = (updated: Contact) => {
    setSelectedContact(updated)
    fetchContacts()
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        const response = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
        const data = await response.json()
        if (data.success) {
          toast.success('Contato excluído')
          setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
          fetchContacts()
        } else {
          toast.error(data.error || 'Erro ao excluir')
        }
      } catch (error) {
        toast.error('Erro ao excluir contato')
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : `${total.toLocaleString()} contatos encontrados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/contatos/importar">
              <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </Link>
            <Link href="/contatos/exportar">
              <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </Link>
            <Link href="/contatos/novo">
              <Button size="sm" className="gap-2 bg-[#46347F] hover:bg-[#3a2c6b]">
                <UserPlus className="h-4 w-4" />
                Adicionar Contato
              </Button>
            </Link>
          </div>
        </div>

        {/* Full Width Table Layout */}
        <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
          {/* Filters */}
          <ContactFilters
            organizationId=""
            onSearch={setSearchQuery}
            onFilterTags={setSelectedTags}
            onFilterStatus={setSelectedStatuses}
            selectedTags={selectedTags}
            selectedStatuses={selectedStatuses}
          />

          {/* Selected Actions */}
          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-[#46347F]/10 p-2">
              <span className="text-sm font-medium text-[#46347F]">
                {selectedContacts.length} contatos selecionados
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-[#46347F]">
                Exportar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-red-600">
                Excluir
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#46347F]" />
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <div className="flex-1 min-h-0 overflow-auto">
              <ContactsTable
                contacts={contacts}
                selectedContacts={selectedContacts}
                onSelectContact={handleSelectContact}
                onSelectAll={handleSelectAll}
                onViewContact={handleViewContact}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </div>
          )}
        </div>
      </main>

      {/* Customer Context Panel */}
      {isPanelOpen && selectedContact && (
        <CustomerContextPanel
          contact={selectedContact}
        />
      )}

      {/* Edit Contact Dialog */}
      <EditContactDialog
        contact={selectedContact}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveContact}
      />
    </div>
  )
}
