"use client"

import { useState, useEffect, useCallback } from 'react'
import { Phone, MessageSquare, FileText, Image, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TextMessageTab } from './text-message-tab'
import { TemplateMessageTab } from './template-message-tab'
import { useSendMessage } from '@/hooks/use-send-message'
import { useWhatsAppTemplatesSync } from '@/hooks/use-whatsapp-templates-sync'
import type { WhatsAppInstance } from '@/hooks/use-whatsapp-instances'
import { cn } from '@/lib/utils'

interface SendMessageFormProps {
  instances: WhatsAppInstance[]
  isLoadingInstances: boolean
  instancesError: string | null
}

// Format phone number - adds 55 if not present
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length > 0 && !digits.startsWith('55')) {
    return '55' + digits
  }
  return digits
}

// Validate phone number (Brazilian format)
function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  // Must start with 55 and have at least 12 digits (55 + DDD + 9 digits)
  return digits.startsWith('55') && digits.length >= 12
}

export function SendMessageForm({
  instances,
  isLoadingInstances,
  instancesError,
}: SendMessageFormProps) {
  // Form state
  const [recipient, setRecipient] = useState('')
  const [selectedInstanceId, setSelectedInstanceId] = useState('')
  const [activeTab, setActiveTab] = useState('text')
  
  // Message state
  const [textMessage, setTextMessage] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  // Hooks
  const { isLoading: isSending, sendMessage } = useSendMessage()
  const {
    templates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    loadTemplates,
  } = useWhatsAppTemplatesSync()

  // Filter connected instances
  const connectedInstances = instances.filter(i => i.status === 'CONNECTED')

  // Auto-select first connected instance
  useEffect(() => {
    if (connectedInstances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(connectedInstances[0].id)
    }
  }, [connectedInstances, selectedInstanceId])

  // Load templates when instance changes
  useEffect(() => {
    if (selectedInstanceId) {
      loadTemplates(selectedInstanceId)
    }
  }, [selectedInstanceId, loadTemplates])

  // Reset template selection when instance changes
  useEffect(() => {
    setSelectedTemplateId('')
  }, [selectedInstanceId])

  // Handle recipient change with auto-formatting
  const handleRecipientChange = useCallback((value: string) => {
    setRecipient(formatPhoneNumber(value))
  }, [])

  // Handle send text message
  const handleSendText = async () => {
    if (!selectedInstanceId || !recipient || !textMessage.trim()) {
      return
    }

    const success = await sendMessage({
      instanceId: selectedInstanceId,
      to: recipient,
      type: 'text',
      text: textMessage,
      previewUrl: true,
    })

    if (success) {
      setTextMessage('')
    }
  }

  // Handle send template message
  const handleSendTemplate = async () => {
    if (!selectedInstanceId || !recipient || !selectedTemplateId) {
      return
    }

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) return

    const success = await sendMessage({
      instanceId: selectedInstanceId,
      to: recipient,
      type: 'template',
      templateName: template.name,
      language: template.language,
    })

    if (success) {
      setSelectedTemplateId('')
    }
  }

  // Validation
  const isPhoneValid = recipient === '' || isValidPhoneNumber(recipient)
  const hasConnectedInstance = connectedInstances.length > 0

  // Loading state
  if (isLoadingInstances) {
    return (
      <Card className="border-2 border-[#25D366]/30">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  // No instances state
  if (!hasConnectedInstance) {
    return (
      <Card className="border-2 border-[#25D366]/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
            <Phone className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma instância conectada</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
            Conecte uma instância WhatsApp Business para enviar mensagens
          </p>
          <Button asChild className="mt-6 gap-2 bg-[#25D366] hover:bg-[#128C7E]">
            <a href="/integracoes/whatsapp/connect">
              Conectar WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-[#25D366]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-[#25D366]" />
          Nova Mensagem
        </CardTitle>
        <CardDescription>
          Envie mensagens diretamente para seus contatos via WhatsApp Business API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Alerts */}
        {(instancesError || templatesError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {instancesError || templatesError}
            </AlertDescription>
          </Alert>
        )}

        {/* Recipient Input */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Destinatário</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="recipient"
              placeholder="5511999999999"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              className={cn(
                "pl-10",
                !isPhoneValid && "border-red-500 focus-visible:ring-red-500"
              )}
              disabled={isSending}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Formato: 55 + DDD + Número (ex: 5511999999999)
          </p>
          {!isPhoneValid && (
            <p className="text-xs text-red-500">
              Número de telefone inválido. Use o formato: 55 + DDD + Número
            </p>
          )}
        </div>

        {/* Instance Select */}
        <div className="space-y-2">
          <Label htmlFor="instance">Instância WhatsApp</Label>
          <Select
            value={selectedInstanceId}
            onValueChange={setSelectedInstanceId}
            disabled={isSending || isLoadingInstances}
          >
            <SelectTrigger id="instance">
              <SelectValue placeholder="Selecione uma instância" />
            </SelectTrigger>
            <SelectContent>
              {connectedInstances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
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

        {/* Message Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">
              <MessageSquare className="h-4 w-4 mr-2" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="template">
              <FileText className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="media" disabled>
              <Image className="h-4 w-4 mr-2" />
              Mídia
            </TabsTrigger>
          </TabsList>

          {/* Text Message Tab */}
          <TabsContent value="text" className="mt-4">
            <TextMessageTab
              message={textMessage}
              onMessageChange={setTextMessage}
              onSend={handleSendText}
              isLoading={isSending}
              disabled={!selectedInstanceId || !recipient || !isPhoneValid}
            />
          </TabsContent>

          {/* Template Message Tab */}
          <TabsContent value="template" className="mt-4">
            {isLoadingTemplates ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <TemplateMessageTab
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={setSelectedTemplateId}
                onSend={handleSendTemplate}
                isLoading={isSending}
                disabled={!selectedInstanceId || !recipient || !isPhoneValid}
              />
            )}
          </TabsContent>

          {/* Media Tab (Disabled) */}
          <TabsContent value="media" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Funcionalidade em breve</p>
              <p className="text-sm mt-1">
                O envio de mídia será disponibilizado em uma atualização futura.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* 24h Window Notice */}
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Janela de 24 horas</p>
              <p className="mt-0.5">
                Mensagens de texto só podem ser enviadas dentro de 24h após a última 
                mensagem do cliente. Use templates para iniciar conversas fora deste período.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
