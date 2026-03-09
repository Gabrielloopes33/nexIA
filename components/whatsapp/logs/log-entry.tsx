"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  RefreshCw,
  FileText,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WhatsAppLog } from '@/hooks/use-whatsapp-logs'
import { formatLogDate, EVENT_TYPE_LABELS } from '@/hooks/use-whatsapp-logs'

interface LogEntryProps {
  log: WhatsAppLog
  isExpanded?: boolean
  onToggle?: () => void
}

// Icones por tipo de evento
const EVENT_ICONS: Record<string, React.ElementType> = {
  message_received: MessageSquare,
  message_sent: Send,
  status_update: RefreshCw,
  template_update: FileText,
  webhook_verify: Shield,
  error: AlertTriangle,
}

// Cores por tipo de evento
const EVENT_COLORS: Record<string, string> = {
  message_received: 'bg-blue-100 text-blue-700 border-blue-200',
  message_sent: 'bg-green-100 text-green-700 border-green-200',
  status_update: 'bg-purple-100 text-purple-700 border-purple-200',
  template_update: 'bg-orange-100 text-orange-700 border-orange-200',
  webhook_verify: 'bg-gray-100 text-gray-700 border-gray-200',
  error: 'bg-red-100 text-red-700 border-red-200',
}

// Cores do ícone por tipo
const EVENT_ICON_COLORS: Record<string, string> = {
  message_received: 'text-blue-600',
  message_sent: 'text-green-600',
  status_update: 'text-purple-600',
  template_update: 'text-orange-600',
  webhook_verify: 'text-gray-600',
  error: 'text-red-600',
}

function getEventIcon(eventType: string): React.ElementType {
  return EVENT_ICONS[eventType] || MessageSquare
}

function getEventColor(eventType: string): string {
  return EVENT_COLORS[eventType] || 'bg-gray-100 text-gray-700 border-gray-200'
}

function getEventIconColor(eventType: string): string {
  return EVENT_ICON_COLORS[eventType] || 'text-gray-600'
}

function getEventLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] || eventType
}

function StatusBadge({ processed, errorMessage, forwardedToN8n }: { 
  processed: boolean
  errorMessage: string | null
  forwardedToN8n: boolean
}) {
  if (errorMessage) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
        <XCircle className="h-3 w-3" />
        Erro
      </Badge>
    )
  }

  if (processed) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Processado
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
      <Clock className="h-3 w-3" />
      Pendente
    </Badge>
  )
}

function PayloadViewer({ payload }: { payload: Record<string, unknown> | null }) {
  const [copied, setCopied] = useState(false)

  if (!payload) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nenhum payload disponível
      </div>
    )
  }

  const payloadString = JSON.stringify(payload, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payloadString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/50">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {payloadString}
        </pre>
      </ScrollArea>
    </div>
  )
}

export function LogEntry({ log, isExpanded = false, onToggle }: LogEntryProps) {
  const [isOpen, setIsOpen] = useState(isExpanded)
  const EventIcon = getEventIcon(log.eventType)
  const eventColor = getEventColor(log.eventType)
  const eventIconColor = getEventIconColor(log.eventType)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.()
  }

  return (
    <Card className="border-border overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-0">
          {/* Header - Always visible */}
          <CollapsibleTrigger asChild>
            <button
              onClick={handleToggle}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                {/* Event Icon */}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  eventColor
                )}>
                  <EventIcon className={cn("h-5 w-5", eventIconColor)} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("text-xs", eventColor)}>
                      {getEventLabel(log.eventType)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatLogDate(log.createdAt)}
                    </span>
                  </div>
                  
                  {/* Instance info if available */}
                  {log.instance && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.instance.name} • {log.instance.phoneNumber}
                    </p>
                  )}

                  {/* Error message preview */}
                  {log.errorMessage && (
                    <p className="text-sm text-red-600 truncate mt-1 max-w-[500px]">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {log.errorMessage}
                    </p>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge 
                    processed={log.processed} 
                    errorMessage={log.errorMessage}
                    forwardedToN8n={log.forwardedToN8n}
                  />
                  {log.forwardedToN8n && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      n8n
                    </Badge>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="shrink-0 text-muted-foreground">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="border-t bg-muted/30 px-4 py-4">
              <div className="space-y-4">
                {/* Log Details */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">ID</p>
                    <p className="text-sm font-mono truncate">{log.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de Evento</p>
                    <p className="text-sm">{getEventLabel(log.eventType)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Criado em</p>
                    <p className="text-sm">{formatLogDate(log.createdAt)}</p>
                  </div>
                  {log.processedAt && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Processado em</p>
                      <p className="text-sm">{formatLogDate(log.processedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Instance Details */}
                {(log.whatsappInstanceId || log.instagramInstanceId) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {log.whatsappInstanceId && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Instância WhatsApp
                        </p>
                        <p className="text-sm font-mono truncate">{log.whatsappInstanceId}</p>
                      </div>
                    )}
                    {log.instagramInstanceId && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Instância Instagram
                        </p>
                        <p className="text-sm font-mono truncate">{log.instagramInstanceId}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {log.errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Erro</p>
                    <p className="text-sm text-red-600">{log.errorMessage}</p>
                  </div>
                )}

                {/* Payload */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Payload</p>
                  <PayloadViewer payload={log.payload} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}

// Skeleton para loading
export function LogEntrySkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para lista de logs
interface LogListProps {
  logs: WhatsAppLog[]
  isLoading?: boolean
  expandedId?: string | null
  onToggleExpand?: (id: string) => void
}

export function LogList({ logs, isLoading, expandedId, onToggleExpand }: LogListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <LogEntrySkeleton key={i} />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <LogEntry
          key={log.id}
          log={log}
          isExpanded={expandedId === log.id}
          onToggle={() => onToggleExpand?.(log.id)}
        />
      ))}
    </div>
  )
}
