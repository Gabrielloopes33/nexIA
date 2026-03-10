"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LogFilters, 
  LogFiltersSkeleton 
} from '@/components/whatsapp/logs/log-filters'
import { 
  LogList, 
  LogEntrySkeleton 
} from '@/components/whatsapp/logs/log-entry'
import { 
  useWhatsAppLogs,
  EVENT_TYPE_LABELS,
} from '@/hooks/use-whatsapp-logs'
import { useWhatsAppInstances } from '@/hooks/use-whatsapp-instances'
import { useWhatsApp } from '@/hooks/use-whatsapp'
import { 
  ScrollText, 
  AlertCircle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  XCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Hook para pegar organizationId
function useOrganizationId(): string | undefined {
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    const saved = localStorage.getItem('current_organization_id')
    if (saved) {
      setOrgId(saved)
    }
  }, [])
  
  return orgId
}

// Stats Card Component
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  isLoading?: boolean
}

function StatCard({ title, value, description, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            colorClasses[color]
          )}>
            <Icon className={cn("h-6 w-6", iconColors[color])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description && !isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <ScrollText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum log encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
          Não encontramos logs com os filtros selecionados. Tente ajustar os filtros ou atualizar a página.
        </p>
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          className="mt-6 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}

// Pagination Component
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
}

function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} • {totalItems} logs
      </p>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={index} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={cn(
                currentPage === page && "bg-[#25D366] hover:bg-[#128C7E]"
              )}
            >
              {page}
            </Button>
          )
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function WhatsAppLogsPage() {
  const organizationId = useOrganizationId()
  const { status } = useWhatsApp()
  const isConnected = status === 'connected'

  // Filtros
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  // Buscar instâncias
  const { 
    instances, 
    isLoading: isLoadingInstances,
    error: instancesError 
  } = useWhatsAppInstances(organizationId)

  // Converter status selecionado para boolean
  const processedFilter = selectedStatus === 'all' 
    ? null 
    : selectedStatus === 'processed' 
      ? true 
      : selectedStatus === 'pending'
        ? false
        : null

  // Buscar logs
  const {
    logs,
    pagination,
    stats,
    isLoading,
    isRefreshing,
    error,
    currentPage,
    setPage,
    refreshLogs,
    clearFilters,
  } = useWhatsAppLogs({
    organizationId,
    instanceId: selectedInstanceId,
    eventType: selectedEventType,
    processed: processedFilter,
    limit: 20,
  })

  // Handlers
  const handleClearFilters = () => {
    setSelectedInstanceId('all')
    setSelectedEventType('all')
    setSelectedStatus('all')
    clearFilters()
  }

  const handleToggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id)
  }

  // Calcular estatísticas
  const totalLogs = stats?.total ?? pagination?.total ?? 0
  const todayLogs = stats?.today ?? 0
  const errorLogs = stats?.errors ?? 0
  const unprocessedLogs = stats?.unprocessed ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]">
            <ScrollText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Logs de Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Visualize os eventos e operações do WhatsApp Business
            </p>
          </div>
        </div>

        {!isConnected && (
          <Button asChild variant="outline" className="gap-2">
            <Link href="/meta-api/whatsapp/connect">
              <RefreshCw className="h-4 w-4" />
              Conectar WhatsApp
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Logs"
          value={totalLogs}
          icon={Database}
          color="blue"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Hoje"
          value={todayLogs}
          description="Eventos nas últimas 24h"
          icon={Calendar}
          color="green"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Erros"
          value={errorLogs}
          description={errorLogs > 0 ? 'Requer atenção' : 'Nenhum erro'}
          icon={XCircle}
          color="red"
          isLoading={isLoading && !stats}
        />
        <StatCard
          title="Não Processados"
          value={unprocessedLogs}
          description={unprocessedLogs > 0 ? 'Pendentes de processamento' : 'Todos processados'}
          icon={Clock}
          color="yellow"
          isLoading={isLoading && !stats}
        />
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          {isLoadingInstances ? (
            <LogFiltersSkeleton />
          ) : (
            <LogFilters
              instances={instances}
              selectedInstanceId={selectedInstanceId}
              selectedEventType={selectedEventType}
              selectedStatus={selectedStatus}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              onInstanceChange={setSelectedInstanceId}
              onEventTypeChange={setSelectedEventType}
              onStatusChange={setSelectedStatus}
              onRefresh={refreshLogs}
              onClearFilters={handleClearFilters}
              totalLogs={pagination?.total}
            />
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {(instancesError || error) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {instancesError || error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && logs.length === 0 && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <LogEntrySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && logs.length === 0 && !error && (
        <EmptyState onClearFilters={handleClearFilters} />
      )}

      {/* Logs List */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <LogList
            logs={logs}
            expandedId={expandedLogId}
            onToggleExpand={handleToggleExpand}
          />

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={setPage}
              totalItems={pagination.total}
            />
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-border bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#46347F]" />
            <CardTitle className="text-base">Sobre os Logs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground mb-1">Tipos de Evento</p>
              <ul className="space-y-1">
                {Object.entries(EVENT_TYPE_LABELS).slice(0, 3).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#46347F]" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Status</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Processado - Evento tratado com sucesso
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-yellow-600" />
                  Pendente - Aguardando processamento
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  Erro - Falha no processamento
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Integração n8n</p>
              <p className="text-muted-foreground">
                Logs marcados com badge &quot;n8n&quot; foram encaminhados para automação. 
                Verifique sua instância n8n para mais detalhes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
