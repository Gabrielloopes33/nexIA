"use client"

import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWhatsAppInstances } from "@/hooks/use-whatsapp-instances"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { cn } from "@/lib/utils"

export function ConnectionStatusCard() {
  const orgId = useOrganizationId()
  const { connectedInstances, instances, isLoading, refresh } = useWhatsAppInstances(orgId)

  const hasConnected = connectedInstances.length > 0
  const officialConnected = connectedInstances.filter(i => i.type === 'OFFICIAL')

  const getStatusConfig = () => {
    if (isLoading) return { label: 'Verificando...', bgColor: 'bg-gray-100', color: 'text-gray-600', description: 'Verificando status da conexão...' }
    if (hasConnected) return { label: 'Conectado', bgColor: 'bg-emerald-100', color: 'text-emerald-700', description: `${connectedInstances.length} instância(s) conectada(s).` }
    if (instances.length > 0) return { label: 'Desconectado', bgColor: 'bg-amber-100', color: 'text-amber-700', description: 'Instâncias encontradas mas nenhuma conectada.' }
    return { label: 'Não Conectado', bgColor: 'bg-gray-100', color: 'text-gray-600', description: 'Conecte sua conta WhatsApp Business para começar.' }
  }

  const config = getStatusConfig()

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    if (hasConnected) return <CheckCircle2 className="h-8 w-8 text-emerald-500" />
    if (instances.length > 0) return <AlertCircle className="h-8 w-8 text-amber-500" />
    return <AlertCircle className="h-8 w-8 text-gray-400" />
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
            className={cn(config.bgColor, config.color, "font-medium")}
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
            <p className="text-sm text-muted-foreground">{config.description}</p>

            {officialConnected.length > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                {officialConnected.map((inst) => (
                  <div key={inst.id}>
                    <p><span className="font-medium">Número:</span> {inst.displayPhoneNumber || inst.phoneNumber}</p>
                    {inst.verifiedName && <p><span className="font-medium">Nome:</span> {inst.verifiedName}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                {hasConnected ? 'Atualizar' : 'Tentar Reconectar'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
