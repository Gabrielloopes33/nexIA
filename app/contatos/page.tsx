"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { ContactFilters } from "@/components/contacts/contact-filters"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { useContacts, Contact } from "@/hooks/use-contacts"
import { useOrganization } from "@/lib/contexts/organization-context"
import { Button } from "@/components/ui/button"
import { Download, Upload, UserPlus, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ContactsPage() {
  const { organization, isLoading: isLoadingOrg } = useOrganization()
  // Usa default_org_id quando não tiver organização carregada
  const organizationId = organization?.id || 'default_org_id'
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Fetch contacts from API - não precisa passar organizationId,
  // o hook usa automaticamente do contexto
  const { 
    contacts, 
    total, 
    isLoading, 
    error,
    deleteContact 
  } = useContacts(undefined, {
    search: searchQuery,
    tags: selectedTags,
    status: selectedStatuses.length === 1 ? selectedStatuses[0] as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' : undefined,
  })

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
    setIsPanelOpen(true)
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      const success = await deleteContact(contact.id)
      if (success) {
        setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Main Content - ocupa o resto */}
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
            <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-0 shadow-sm">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Link href="/contatos/novo">
              <Button size="sm" className="gap-2 bg-[#46347F] hover:bg-[#46347F]">
                <UserPlus className="h-4 w-4" />
                Adicionar Contato
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Full Width Table Layout - ocupa altura total */}
        <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
            {/* Filters */}
            <ContactFilters
              organizationId={organizationId}
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

            {/* Table - ocupa espaço restante */}
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

      {/* Contact Detail Panel */}
      {isPanelOpen && selectedContact && (
        <ContactDetailPanel
          contact={selectedContact}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  )
}
