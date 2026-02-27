"use client"

import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Loader2, 
  Star,
  Settings,
  MessageSquare,
  Clock
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatRelativeDate } from "@/lib/utils"
import type { Integration } from "@/lib/types/integration"

interface Props {
  integration: Integration
  onConnect: (id: string) => void
  onConfigure: (id: string) => void
}

const STATUS_CONFIG = {
  not_connected: {
    label: 'Disponível',
    className: 'bg-secondary text-secondary-foreground shadow-sm',
    icon: null,
  },
  connecting: {
    label: 'Conectando...',
    className: 'bg-blue-100 text-blue-700 border-2 border-blue-200',
    icon: Loader2,
  },
  connected: {
    label: 'Conectado',
    className: 'bg-[#9795e4]/10 text-[#7573b8] shadow-sm',
    icon: CheckCircle,
  },
  syncing: {
    label: 'Sincronizando',
    className: 'bg-blue-100 text-blue-700 border-2 border-blue-200',
    icon: Loader2,
  },
  error: {
    label: 'Erro',
    className: 'bg-red-100 text-red-700 border-2 border-red-200',
    icon: AlertCircle,
  },
  warning: {
    label: 'Atenção',
    className: 'bg-amber-100 text-amber-700 border-2 border-amber-200',
    icon: AlertTriangle,
  },
  paused: {
    label: 'Pausado',
    className: 'bg-secondary text-secondary-foreground shadow-sm',
    icon: null,
  },
}

export function IntegrationCard({ integration, onConnect, onConfigure }: Props) {
  const statusConfig = STATUS_CONFIG[integration.status]
  const StatusIcon = statusConfig.icon
  const isConnected = integration.status === 'connected' || integration.status === 'syncing'
  const hasError = integration.status === 'error' || integration.status === 'warning'

  return (
    <Card className="rounded-sm shadow-sm">
      {/* Popular Badge */}
      {integration.popular && (
        <div className="absolute left-3 top-3 z-10">
          <Badge className="bg-[#9795e4]/10 text-[#7573b8] shadow-sm text-[10px]">
            <Star className="mr-1 h-3 w-3 fill-current" />
            Popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar com iniciais */}
            <div 
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-sm font-bold text-white"
              style={{ backgroundColor: integration.color }}
            >
              {integration.name.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {integration.name}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {integration.category === 'infoproduct' ? 'Infoproduto' : integration.category}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn("shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium flex items-center gap-1", statusConfig.className)}>
            {StatusIcon && (
              <StatusIcon 
                className={cn(
                  "h-3 w-3",
                  integration.status === 'syncing' && "animate-spin"
                )} 
              />
            )}
            {statusConfig.label}
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="p-4 pt-0">
        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground mb-3">
          {integration.description}
        </p>

        {/* Metrics (if connected) */}
        {isConnected && integration.messagesCount !== undefined && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {integration.messagesCount} mensagens
            </span>
            {integration.lastSyncAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(integration.lastSyncAt.toISOString())
                  .replace(' atrás', '')
                  .replace('Hoje', 'Agora')
                  .replace('Ontem', '1d')}
              </span>
            )}
          </div>
        )}

        {/* Features - estilo tags do RecentLeads */}
        <div className="flex flex-wrap gap-1">
          {integration.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium border border-[#9795e4]/30 bg-[#9795e4]/10 text-[#7573b8]"
            >
              {feature}
            </span>
          ))}
          {integration.features.length > 3 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-secondary text-muted-foreground">
              +{integration.features.length - 3}
            </span>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0">
        {isConnected ? (
          <button 
            onClick={() => onConfigure(integration.id)}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-sm shadow-sm bg-card text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Settings className="h-4 w-4" />
            Configurar
          </button>
        ) : hasError ? (
          <button 
            onClick={() => onConfigure(integration.id)}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-red-500 to-red-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <AlertTriangle className="h-4 w-4" />
            Corrigir
          </button>
        ) : (
          <button 
            onClick={() => onConnect(integration.id)}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-[#9795e4] to-[#b3b3e5] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Conectar
          </button>
        )}
      </CardFooter>
    </Card>
  )
}
