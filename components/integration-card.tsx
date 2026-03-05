"use client"

import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Loader2, 
  Star,
  Settings,
  MessageSquare,
  Clock,
  Instagram
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
            {/* Avatar/Ícone da integração */}
            <div 
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white"
              style={{ backgroundColor: integration.color }}
            >
              {integration.slug === 'whatsapp' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              ) : integration.slug === 'instagram' ? (
                <Instagram className="h-5 w-5" />
              ) : integration.slug === 'hotmart' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97-.001c-.156 0-.318.165-.318.165l-2.505 4.182-1.496-4.175c-.053-.149-.193-.172-.265-.172h-1.91c-.116 0-.174.072-.174.174 0 .035.01.07.029.11l2.53 6.349-1.382 2.18c-.052.084-.048.174.038.174h1.996c.15 0 .315-.166.315-.166l3.746-6.004 1.322 3.579c.052.148.19.171.262.171h1.909c.117 0 .175-.072.175-.174 0-.035-.01-.07-.03-.11l-2.146-5.67 1.465-2.442c.053-.084.049-.174-.037-.174h-.564z"/>
                </svg>
              ) : (
                <span className="text-sm font-bold">{integration.name.substring(0, 2).toUpperCase()}</span>
              )}
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
