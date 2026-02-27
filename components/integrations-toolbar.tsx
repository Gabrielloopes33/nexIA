"use client"

import { Search, Download, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

const categoryLabels: Record<IntegrationCategory | 'all', string> = {
  all: 'Todas Categorias',
  communication: 'Comunicação',
  infoproduct: 'Infoprodutos',
  email: 'Email',
  analytics: 'Analytics',
  automation: 'Automação',
}

const statusLabels: Record<Props['filterStatus'], string> = {
  all: 'Todas',
  connected: 'Conectadas',
  not_connected: 'Disponíveis',
  error: 'Com Problemas',
}

const sortLabels: Record<Props['sortBy'], string> = {
  popular: 'Popular',
  name: 'A-Z',
  recent: 'Recentes',
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
            className="h-10 rounded-sm shadow-sm border-0 pl-9"
          />
        </div>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm shadow-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <span className="text-sm">{statusLabels[filterStatus]}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex flex-col gap-1">
              {(Object.keys(statusLabels) as Props['filterStatus'][]).map((status) => (
                <button
                  key={status}
                  onClick={() => onFilterStatusChange(status)}
                  className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                    filterStatus === status ? 'bg-secondary' : ''
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm shadow-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <span className="text-sm">{categoryLabels[filterCategory]}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex flex-col gap-1">
              {(Object.keys(categoryLabels) as (IntegrationCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onFilterCategoryChange(cat)}
                  className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                    filterCategory === cat ? 'bg-secondary' : ''
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 items-center gap-2 rounded-sm shadow-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary">
              <span className="text-sm">{sortLabels[sortBy]}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="flex flex-col gap-1">
              {(Object.keys(sortLabels) as Props['sortBy'][]).map((sort) => (
                <button
                  key={sort}
                  onClick={() => onSortByChange(sort)}
                  className={`rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary ${
                    sortBy === sort ? 'bg-secondary' : ''
                  }`}
                >
                  {sortLabels[sort]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Export Button */}
      {hasConnectedIntegrations && (
        <button 
          onClick={onExportLogs}
          className="flex h-10 items-center gap-2 rounded-sm shadow-sm bg-card px-3 text-foreground transition-colors hover:bg-secondary"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Exportar Logs</span>
        </button>
      )}
    </div>
  )
}
