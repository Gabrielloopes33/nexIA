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
import { Button } from "@/components/ui/button"
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
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: null,
  },
  connecting: {
    label: 'Conectando...',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Loader2,
  },
  connected: {
    label: 'Conectado',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle,
  },
  syncing: {
    label: 'Sincronizando',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Loader2,
  },
  error: {
    label: 'Erro',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertCircle,
  },
  warning: {
    label: 'Atenção',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: AlertTriangle,
  },
  paused: {
    label: 'Pausado',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: null,
  },
}

export function IntegrationCard({ integration, onConnect, onConfigure }: Props) {
  const statusConfig = STATUS_CONFIG[integration.status]
  const StatusIcon = statusConfig.icon
  const isConnected = integration.status === 'connected' || integration.status === 'syncing'
  const hasError = integration.status === 'error' || integration.status === 'warning'

  return (
    <Card 
      className={cn(
        "group relative h-[280px] transition-all hover:scale-[1.02] hover:shadow-lg",
        "flex flex-col"
      )}
    >
      {/* Popular Badge */}
      {integration.popular && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
            <Star className="mr-1 h-3 w-3 fill-current" />
            Popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${integration.color}15` }}
          >
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: integration.color }}
            >
              {integration.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {integration.name}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              {integration.category === 'infoproduct' ? 'Infoproduto' : integration.category}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge className={cn("shrink-0", statusConfig.className)}>
          {StatusIcon && (
            <StatusIcon 
              className={cn(
                "mr-1 h-3 w-3",
                integration.status === 'syncing' && "animate-spin"
              )} 
            />
          )}
          {statusConfig.label}
        </Badge>
      </CardHeader>

      {/* Body */}
      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {integration.description}
        </p>

        {/* Metrics (if connected) */}
        {isConnected && integration.messagesCount !== undefined && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

        {/* Features */}
        <div className="flex flex-wrap gap-1.5">
          {integration.features.slice(0, 3).map((feature) => (
            <Badge 
              key={feature} 
              variant="secondary" 
              className="text-[10px] font-medium px-2 py-0.5"
            >
              {feature}
            </Badge>
          ))}
          {integration.features.length > 3 && (
            <Badge 
              variant="secondary" 
              className="text-[10px] font-medium px-2 py-0.5"
            >
              +{integration.features.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="border-t pt-4">
        {isConnected ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onConfigure(integration.id)}
            className="w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        ) : hasError ? (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onConfigure(integration.id)}
            className="w-full"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Corrigir Conexão
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={() => onConnect(integration.id)}
            className="w-full"
          >
            Conectar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
