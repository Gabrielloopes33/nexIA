"use client"

import { Search, Filter, Trash2 } from "lucide-react"
import { ContactStatus, ContactSource } from "@/lib/types/contact"

interface ContactsToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: ContactStatus | "todos"
  onFilterStatusChange: (value: ContactStatus | "todos") => void
  filterSource: ContactSource | "todos"
  onFilterSourceChange: (value: ContactSource | "todos") => void
  selectedCount: number
  onBulkDelete?: () => void
}

export function ContactsToolbar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterSource,
  onFilterSourceChange,
  selectedCount,
  onBulkDelete,
}: ContactsToolbarProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Filtro Status */}
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value as ContactStatus | "todos")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="aguardando">Aguardando</option>
            </select>

            {/* Filtro Fonte */}
            <select
              value={filterSource}
              onChange={(e) => onFilterSourceChange(e.target.value as ContactSource | "todos")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todas as Fontes</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Manual">Manual</option>
              <option value="Import">Importação</option>
              <option value="API">API</option>
            </select>
          </div>
        </div>

        {/* Ações em massa */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}
            </span>
            <button
              onClick={onBulkDelete}
              className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
