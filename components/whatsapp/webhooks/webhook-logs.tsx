"use client"

import { useState } from "react"
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { WebhookLog, WebhookEventType } from "@/lib/whatsapp/types"
import { cn } from "@/lib/utils"

interface WebhookLogsProps {
  logs: WebhookLog[]
  onRefresh?: () => void
  isLoading?: boolean
}

const eventLabels: Record<WebhookEventType, string> = {
  messages: 'Mensagem',
  message_template_status_update: 'Status de Template',
  phone_number_quality_update: 'Qualidade do Número',
  phone_number_name_update: 'Nome do Número',
  account_alerts: 'Alerta da Conta',
  account_review_update: 'Revisão da Conta',
  business_capability_update: 'Capacidade de Negócio',
  template_category_update: 'Categoria de Template',
}

export function WebhookLogs({ logs, onRefresh, isLoading = false }: WebhookLogsProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const toggleLog = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(logId)) {
        next.delete(logId)
      } else {
        next.add(logId)
      }
      return next
    })
  }

  const getStatusIcon = (status: WebhookLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: WebhookLog['status']) => {
    const config = {
      success: { label: 'Sucesso', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      error: { label: 'Erro', className: 'bg-red-50 text-red-700 border-red-200' },
      pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    }
    const { label, className } = config[status]
    return (
      <Badge variant="outline" className={cn("h-5 text-[10px]", className)}>
        {label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#46347F]/10">
              <Activity className="h-5 w-5 text-[#46347F]" />
            </div>
            <div>
              <CardTitle>Logs de Eventos</CardTitle>
              <CardDescription>
                Histórico de eventos recebidos via webhook
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <Activity className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <Collapsible
                  key={log.id}
                  open={expandedLogs.has(log.id)}
                  onOpenChange={() => toggleLog(log.id)}
                >
                  <div className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <CollapsibleTrigger asChild>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium">
                              {eventLabels[log.event] || log.event}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          {expandedLogs.has(log.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {/* Payload */}
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Payload:
                          </p>
                          <pre className="rounded-md bg-muted p-2 text-xs overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Error Message */}
                        {log.errorMessage && (
                          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                            <span className="font-medium">Erro: </span>
                            {log.errorMessage}
                          </div>
                        )}

                        {/* Retry Count */}
                        {log.retryCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Tentativas de reenvio: {log.retryCount}
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
