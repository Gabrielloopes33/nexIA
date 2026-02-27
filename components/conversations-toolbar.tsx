"use client"

import { Search, Filter, Archive, UserPlus, CheckCircle, XCircle, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filterPriority: string
  onFilterPriorityChange: (value: string) => void
  filterAssignment: string
  onFilterAssignmentChange: (value: string) => void
  filterChannel: string
  onFilterChannelChange: (value: string) => void
  selectedCount: number
  onBulkArchive: () => void
  onBulkAssign: () => void
  onBulkClose: () => void
  onBulkDelete: () => void
  onExport: () => void
}

export function ConversationsToolbar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  filterAssignment,
  onFilterAssignmentChange,
  filterChannel,
  onFilterChannelChange,
  selectedCount,
  onBulkArchive,
  onBulkAssign,
  onBulkClose,
  onBulkDelete,
  onExport,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border px-6 py-4">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar conversas por nome, empresa, mensagem..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="solved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignment Filter */}
        <Select value={filterAssignment} onValueChange={onFilterAssignmentChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Atribuição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Atribuições</SelectItem>
            <SelectItem value="assigned">Atribuídas</SelectItem>
            <SelectItem value="unassigned">Não Atribuídas</SelectItem>
            <SelectItem value="me">Minhas</SelectItem>
          </SelectContent>
        </Select>

        {/* Channel Filter */}
        <Select value={filterChannel} onValueChange={onFilterChannelChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Canais</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="iframe">Iframe</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button variant="outline" size="sm" onClick={onExport} className="shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Bulk Actions Row (appears when items are selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-[#7C3AED]/5 border border-[#7C3AED]/20 px-4 py-2.5">
          <p className="text-sm font-medium text-foreground">
            {selectedCount} conversa{selectedCount !== 1 ? "s" : ""} selecionada{selectedCount !== 1 ? "s" : ""}
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBulkArchive}>
              <Archive className="h-3.5 w-3.5 mr-1.5" />
              Arquivar
            </Button>

            <Button variant="outline" size="sm" onClick={onBulkAssign}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Atribuir
            </Button>

            <Button variant="outline" size="sm" onClick={onBulkClose}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Fechar
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
