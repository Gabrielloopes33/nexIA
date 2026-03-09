"use client"

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, X, Filter, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_TYPES } from '@/hooks/use-whatsapp-logs'
import type { WhatsAppInstance } from '@/hooks/use-whatsapp-instances'

interface LogFiltersProps {
  instances: WhatsAppInstance[]
  selectedInstanceId: string
  selectedEventType: string
  selectedStatus: string
  isLoading?: boolean
  isRefreshing?: boolean
  onInstanceChange: (value: string) => void
  onEventTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onRefresh: () => void
  onClearFilters: () => void
  totalLogs?: number
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'processed', label: 'Processado' },
  { value: 'pending', label: 'Não Processado' },
  { value: 'error', label: 'Com Erro' },
]

export function LogFilters({
  instances,
  selectedInstanceId,
  selectedEventType,
  selectedStatus,
  isLoading,
  isRefreshing,
  onInstanceChange,
  onEventTypeChange,
  onStatusChange,
  onRefresh,
  onClearFilters,
  totalLogs,
}: LogFiltersProps) {
  const hasActiveFilters = 
    selectedInstanceId !== 'all' || 
    selectedEventType !== 'all' || 
    selectedStatus !== 'all'

  const activeFiltersCount = [
    selectedInstanceId !== 'all',
    selectedEventType !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Instance Filter */}
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedInstanceId} onValueChange={onInstanceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as instâncias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as instâncias</SelectItem>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      instance.status === 'CONNECTED' ? "bg-green-500" : "bg-gray-300"
                    )} />
                    <span className="truncate">{instance.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({instance.phoneNumber})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Type Filter */}
        <div className="w-full sm:w-[200px]">
          <Select value={selectedEventType} onValueChange={onEventTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-[180px]">
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {selectedInstanceId !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Instância: {instances.find(i => i.id === selectedInstanceId)?.name || selectedInstanceId}
              <button 
                onClick={() => onInstanceChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedEventType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Evento: {EVENT_TYPES.find(t => t.value === selectedEventType)?.label || selectedEventType}
              <button 
                onClick={() => onEventTypeChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label || selectedStatus}
              <button 
                onClick={() => onStatusChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      {totalLogs !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScrollText className="h-4 w-4" />
          <span>
            {totalLogs === 0 
              ? 'Nenhum log encontrado' 
              : `${totalLogs} log${totalLogs === 1 ? '' : 's'} encontrado${totalLogs === 1 ? '' : 's'}`
            }
          </span>
        </div>
      )}
    </div>
  )
}

// Skeleton para loading
export function LogFiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
      <div className="w-full sm:w-[200px] h-10 bg-muted animate-pulse rounded-md" />
      <div className="w-full sm:w-[180px] h-10 bg-muted animate-pulse rounded-md" />
      <div className="w-[120px] h-10 bg-muted animate-pulse rounded-md" />
    </div>
  )
}
