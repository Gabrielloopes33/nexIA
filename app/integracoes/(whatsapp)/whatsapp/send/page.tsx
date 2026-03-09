"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, HelpCircle } from 'lucide-react'
import { SendMessageForm } from '@/components/whatsapp/send/send-message-form'
import { useWhatsAppInstances } from '@/hooks/use-whatsapp-instances'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Hook para pegar organizationId - simplificado
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

export default function WhatsAppSendPage() {
  const organizationId = useOrganizationId()
  const { 
    instances, 
    isLoading: isLoadingInstances, 
    error: instancesError,
  } = useWhatsAppInstances(organizationId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild className="mt-1">
            <Link href="/integracoes/whatsapp">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-[#25D366]" />
              Enviar Mensagem
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Envie mensagens diretamente para seus contatos via WhatsApp Business API
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://business.whatsapp.com/products/business-platform" 
              target="_blank" 
              rel="noopener noreferrer"
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Ajuda
            </a>
          </Button>
        </div>
      </div>

      {/* Compliance Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>Diretrizes da Meta:</strong> Respeite as políticas do WhatsApp Business. 
          Mensagens de marketing só podem ser enviadas usando templates aprovados fora da janela de 24h. 
          Spam pode resultar em bloqueio do número.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      {!isLoadingInstances && instances.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/10">
                <Send className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-medium">Envio Direto</p>
                <p className="text-xs text-muted-foreground">Texto ou Template</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-lg font-bold text-blue-600">24h</span>
              </div>
              <div>
                <p className="text-sm font-medium">Janela de Conversa</p>
                <p className="text-xs text-muted-foreground">Para mensagens de texto</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <span className="text-lg font-bold text-green-600">
                  {instances.filter(i => i.status === 'CONNECTED').length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Instâncias Ativas</p>
                <p className="text-xs text-muted-foreground">Prontas para envio</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Message Form */}
      <SendMessageForm
        instances={instances}
        isLoadingInstances={isLoadingInstances}
        instancesError={instancesError}
      />
    </div>
  )
}
