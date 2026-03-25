"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquarePlus, Send, User, Mail, Phone, Tag, Smartphone, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useConnectedInstances } from "@/hooks/use-connected-instances"
import { useConversations } from "@/hooks/use-conversations"
import { Alert, AlertDescription } from "@/components/ui/alert"

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-blue-600" },
  { value: "medium", label: "Média", color: "text-yellow-600" },
  { value: "high", label: "Alta", color: "text-orange-600" },
  { value: "urgent", label: "Urgente", color: "text-red-600" },
]

interface Channel {
  value: string
  label: string
  icon: string
  disabled?: boolean
}

export default function NovaConversaPage() {
  const router = useRouter()
  const { instances, isLoading: isLoadingInstances, error: instancesError } = useConnectedInstances()
  const { createConversation, sendMessage } = useConversations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    channel: "",
    instanceId: "",
    priority: "medium",
    tags: "",
    message: "",
  })

  // Build available channels based on connected instances
  const CHANNELS: Channel[] = [
    { value: "whatsapp", label: "WhatsApp (Evolution)", icon: "📱", disabled: instances.length === 0 },
    { value: "instagram", label: "Instagram", icon: "📷", disabled: true },
    { value: "chat", label: "Chat Widget", icon: "💬", disabled: true },
  ]

  // Auto-select first instance when instances load
  useEffect(() => {
    if (instances.length > 0 && !formData.instanceId) {
      setFormData(prev => ({ ...prev, instanceId: instances[0].id, channel: "whatsapp" }))
    }
  }, [instances, formData.instanceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.instanceId) {
      toast.error("Selecione uma instância WhatsApp")
      return
    }

    if (!formData.phone) {
      toast.error("Informe o número de telefone")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create or find contact (simplified - in production would check if contact exists)
      const contactResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || formData.phone,
          phone: formData.phone,
          email: formData.email || undefined,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        }),
      })

      if (!contactResponse.ok) {
        throw new Error('Erro ao criar contato')
      }

      const contactData = await contactResponse.json()
      const contactId = contactData.data?.id || contactData.id

      if (!contactId) {
        throw new Error('ID do contato não encontrado')
      }

      // 2. Create conversation
      const conversation = await createConversation({
        contactId,
        instanceId: formData.instanceId,
        type: 'USER_INITIATED',
      })

      if (!conversation) {
        throw new Error('Erro ao criar conversa')
      }

      // 3. Send initial message if provided
      if (formData.message.trim()) {
        // For Evolution API, use the send message endpoint
        const instance = instances.find(i => i.id === formData.instanceId)
        if (instance) {
          const messageResponse = await fetch('/api/evolution/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instanceName: instance.instanceName,  // Envia o nome da instância
              phone: formData.phone,
              message: formData.message,
            }),
          })

          if (!messageResponse.ok) {
            const errorData = await messageResponse.json()
            console.error('Erro ao enviar mensagem:', errorData)
            // Don't throw - conversation is created, just warn user
            toast.warning('Conversa criada, mas houve um erro ao enviar a mensagem inicial')
          } else {
            // Also save message to conversation
            await sendMessage(conversation.id, {
              content: formData.message,
              type: 'TEXT',
            })
          }
        }
      }

      toast.success('Conversa iniciada com sucesso!', {
        description: `${formData.name || formData.phone} - Canal: WhatsApp`,
      })

      // Redirect to the conversation
      router.push(`/conversas?id=${conversation.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Erro ao criar conversa', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/conversas")
  }

  const selectedInstance = instances.find(i => i.id === formData.instanceId)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nova Conversa</h1>
              <p className="text-sm text-muted-foreground">
                Inicie uma nova conversa com um cliente via WhatsApp
              </p>
            </div>
          </div>

          {/* No Instances Warning */}
          {!isLoadingInstances && instances.length === 0 && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <p className="font-medium">Nenhuma instância WhatsApp conectada</p>
                <p className="text-sm mt-1">
                  Você precisa conectar uma instância WhatsApp na página de 
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-amber-700 underline"
                    onClick={() => router.push('/integracoes/whatsapp-nao-oficial')}
                  >
                    Integrações → WhatsApp Não Oficial
                  </Button>
                  {" "}antes de iniciar conversas.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Instances Error */}
          {instancesError && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Erro ao carregar instâncias: {instancesError}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-[#46347F]" />
                Dados da Conversa
              </CardTitle>
              <CardDescription>
                Preencha as informações para iniciar uma nova conversa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Instância WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="instance">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    Instância WhatsApp *
                  </Label>
                  <Select
                    value={formData.instanceId}
                    onValueChange={(value) => setFormData({ ...formData, instanceId: value })}
                    disabled={isLoadingInstances || instances.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingInstances 
                          ? "Carregando instâncias..." 
                          : instances.length === 0 
                            ? "Nenhuma instância conectada" 
                            : "Selecione a instância"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">●</span>
                            {instance.name}
                            {instance.phoneNumber && (
                              <span className="text-muted-foreground text-xs">
                                ({instance.phoneNumber})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInstance && (
                    <p className="text-xs text-muted-foreground">
                      Conectado como: <strong>{selectedInstance.profileName || selectedInstance.phoneNumber || 'Desconhecido'}</strong>
                    </p>
                  )}
                </div>

                {/* Informações do Contato */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Informações do Contato
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="h-4 w-4 inline mr-1" />
                        Nome completo
                      </Label>
                      <Input
                        id="name"
                        placeholder="Digite o nome do cliente"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 98765-4321"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="cliente@empresa.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Configurações */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Configurações
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <span className={priority.color}>●</span> {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">
                        <Tag className="h-4 w-4 inline mr-1" />
                        Tags
                      </Label>
                      <Input
                        id="tags"
                        placeholder="vendas, suporte, urgente"
                        value={formData.tags}
                        onChange={(e) =>
                          setFormData({ ...formData, tags: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Mensagem Inicial */}
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem inicial</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite a mensagem inicial da conversa (opcional)..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem será enviada via WhatsApp para o número informado.
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || instances.length === 0 || !formData.phone}
                    className="bg-[#46347F] hover:bg-[#8886d4] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Iniciar Conversa
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
