"use client"

import { Contact } from "@/lib/types/contact"
import { ContactRow } from "@/components/contact-row"

interface ContactsTableProps {
  contacts: Contact[]
  selectedIds: number[]
  onSelectContact: (id: number, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onToggleFavorite: (id: number) => void
  onViewContact?: (id: number) => void
  onEditContact?: (id: number) => void
}

export function ContactsTable({
  contacts,
  selectedIds,
  onSelectContact,
  onSelectAll,
  onToggleFavorite,
  onViewContact,
  onEditContact,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < contacts.length

  return (
    <div className="rounded-sm bg-card shadow-sm border-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-0">
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected
                    }
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contato
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Empresa
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Fonte
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Último Contato
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tags
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-sm text-muted-foreground">
                    Nenhum contato encontrado
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  selected={selectedIds.includes(contact.id)}
                  onSelect={onSelectContact}
                  onToggleFavorite={onToggleFavorite}
                  onView={onViewContact}
                  onEdit={onEditContact}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {contacts.length > 0 && (
        <div className="flex items-center justify-between border-0 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{contacts.length}</span> contatos
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
