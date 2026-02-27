"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContactsSubSidebar } from "@/components/contacts/contacts-sub-sidebar"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { ContactFilters } from "@/components/contacts/contact-filters"
import { ContactDetailPanel } from "@/components/contact-detail-panel"
import { MOCK_CONTACTS, Contact } from "@/lib/mock/contacts"
import { Button } from "@/components/ui/button"
import { Download, Upload, UserPlus } from "lucide-react"
import Link from "next/link"

export default function ContactsPage() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return MOCK_CONTACTS.filter((contact) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        contact.nome.toLowerCase().includes(searchLower) ||
        contact.sobrenome.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.empresa.toLowerCase().includes(searchLower) ||
        contact.telefone.includes(searchQuery)

      // Tag filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tagId) => contact.tags.includes(tagId))

      // Status filter
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(contact.status)

      return matchesSearch && matchesTags && matchesStatus
    })
  }, [searchQuery, selectedTags, selectedStatuses])

  const handleSelectContact = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts([...selectedContacts, id])
    } else {
      setSelectedContacts(selectedContacts.filter((c) => c !== id))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(filteredContacts.map((c) => c.id))
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

  const handleDeleteContact = (contact: Contact) => {
    // TODO: Implement delete
    console.log("Delete contact:", contact.id)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Contacts Sub-Sidebar */}
      <ContactsSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 ml-[292px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
            <p className="text-sm text-muted-foreground">
              {filteredContacts.length.toLocaleString()} contatos encontrados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Link href="/contatos/novo">
              <Button size="sm" className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
                <UserPlus className="h-4 w-4" />
                Adicionar Contato
              </Button>
            </Link>
          </div>
        </div>

        {/* Full Width Table Layout */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Filters */}
            <ContactFilters
              onSearch={setSearchQuery}
              onFilterTags={setSelectedTags}
              onFilterStatus={setSelectedStatuses}
              selectedTags={selectedTags}
              selectedStatuses={selectedStatuses}
            />

            {/* Selected Actions */}
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-[#9795e4]/10 p-2">
                <span className="text-sm font-medium text-[#9795e4]">
                  {selectedContacts.length} contatos selecionados
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-[#9795e4]">
                  Exportar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-red-600">
                  Excluir
                </Button>
              </div>
            )}

            {/* Table */}
            <ContactsTable
              contacts={filteredContacts}
              selectedContacts={selectedContacts}
              onSelectContact={handleSelectContact}
              onSelectAll={handleSelectAll}
              onViewContact={handleViewContact}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
            />
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
