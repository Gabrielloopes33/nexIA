"use client"

import { Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { IntegrationCategory } from "@/lib/types/integration"

interface Props {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterCategory: IntegrationCategory | 'all'
  onFilterCategoryChange: (value: IntegrationCategory | 'all') => void
  filterStatus: 'all' | 'connected' | 'not_connected' | 'error'
  onFilterStatusChange: (value: 'all' | 'connected' | 'not_connected' | 'error') => void
  sortBy: 'popular' | 'name' | 'recent'
  onSortByChange: (value: 'popular' | 'name' | 'recent') => void
  hasConnectedIntegrations: boolean
  onExportLogs: () => void
}

export function IntegrationsToolbar({
  searchTerm,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  hasConnectedIntegrations,
  onExportLogs,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3">
        {/* Search */}
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar integrações..."
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="connected">Conectadas</SelectItem>
            <SelectItem value="not_connected">Disponíveis</SelectItem>
            <SelectItem value="error">Com Problemas</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={filterCategory} onValueChange={(value) => onFilterCategoryChange(value as IntegrationCategory | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="communication">Comunicação</SelectItem>
            <SelectItem value="infoproduct">Infoprodutos</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="automation">Automação</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as 'popular' | 'name' | 'recent')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
            <SelectItem value="recent">Recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Export Button */}
      {hasConnectedIntegrations && (
        <Button variant="outline" onClick={onExportLogs}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      )}
    </div>
  )
}
