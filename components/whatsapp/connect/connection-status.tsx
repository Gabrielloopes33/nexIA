"use client"

import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { CONNECTION_STATUS_CONFIG } from "@/lib/whatsapp/constants"
import { cn } from "@/lib/utils"

export function ConnectionStatusCard() {
  const { account, status, isLoading, error, refresh, disconnect } = useWhatsApp()

  const config = CONNECTION_STATUS_CONFIG[status] || CONNECTION_STATUS_CONFIG.not_connected

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      case 'connecting':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'error':
      case 'token_expired':
        return <XCircle className="h-8 w-8 text-red-500" />
      case 'disconnected':
        return <AlertCircle className="h-8 w-8 text-amber-500" />
      default:
        return <AlertCircle className="h-8 w-8 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Status da Conexão</CardTitle>
            <CardDescription>
              Estado atual da integração com WhatsApp Business API
            </CardDescription>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              config.bgColor,
              config.color,
              "font-medium"
            )}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
            
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                <span className="font-medium">Erro: </span>
                {error}
              </div>
            )}

            {account && status === 'connected' && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p><span className="font-medium">Conta:</span> {account.name}</p>
                <p><span className="font-medium">WABA ID:</span> {account.wabaId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conectado em: {new Date(account.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {status === 'connected' ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refresh}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Atualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={disconnect}
                    disabled={isLoading}
                    className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Desconectar
                  </Button>
                </>
              ) : status !== 'connecting' ? (
                <Button 
                  size="sm" 
                  onClick={refresh}
                  disabled={isLoading}
                  className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Tentar Reconectar
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
