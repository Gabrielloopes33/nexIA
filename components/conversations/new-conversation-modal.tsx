"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MessageSquarePlus, Phone, User, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useOrganizationId } from "@/lib/contexts/organization-context"
import { useWhatsAppInstances } from "@/hooks/use-whatsapp-instances"

interface NewConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface CreateConversationResponse {
  success: boolean
  data?: {
    id: string
    contactId: string
  }
  message?: string
  error?: string
}

export function NewConversationModal({ open, onOpenChange, onSuccess }: NewConversationModalProps) {
  const router = useRouter()
  const organizationId = useOrganizationId()
  const { connectedInstances, isLoading: loadingInstances } = useWhatsAppInstances(organizationId)
  
  const [step, setStep] = useState<"form" | "sending" | "success" | "error">("form")
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    instanceId: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep("form")
      setFormData({ phone: "", name: "", instanceId: "", message: "" })
      setErrors({})
    }
  }, [open])

  // Auto-seleciona primeira instância se houver apenas uma
  useEffect(() => {
    if (connectedInstances.length === 1 && !formData.instanceId) {
      setFormData(prev => ({ ...prev, instanceId: connectedInstances[0].id }))
    }
  }, [connectedInstances, formData.instanceId])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors.phone = "Número de telefone é obrigatório"
    } else {
      // Valida formato internacional
      const phoneClean = formData.phone.replace(/\D/g, "")
      if (phoneClean.length < 10 || phoneClean.length > 15) {
        newErrors.phone = "Número inválido. Use formato internacional (ex: 5511999999999)"
      }
    }

    if (!formData.instanceId) {
      newErrors.instanceId = "Selecione um canal WhatsApp"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Digite uma mensagem inicial"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPhone = (phone: string): string => {
    return phone.replace(/\D/g, "")
  }

  const handleSubmit = async () => {
    if (!validateForm() || !organizationId) return

    setStep("sending")

    try {
      const phoneFormatted = formatPhone(formData.phone)

      // 1. Criar ou buscar contato
      let contactId: string
      
      const contactResponse = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneFormatted,
          name: formData.name || undefined,
        }),
      })

      const contactData = await contactResponse.json()

      if (contactResponse.ok && contactData.success) {
        // Contato criado com sucesso
        contactId = contactData.data.id
      } else if (contactResponse.status === 409 && contactData.error) {
        // Contato já existe - buscar por telefone
        const searchResponse = await fetch(`/api/contacts?search=${phoneFormatted}&limit=1`)
        const searchData = await searchResponse.json()
        
        if (searchResponse.ok && searchData.success && searchData.data.length > 0) {
          contactId = searchData.data[0].id
          
          // Atualiza nome se informado e contato não tinha nome
          if (formData.name && !searchData.data[0].name) {
            await fetch(`/api/contacts/${contactId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: formData.name }),
            })
          }
        } else {
          throw new Error("Contato existe mas não pôde ser localizado")
        }
      } else {
        throw new Error(contactData.error || "Erro ao criar contato")
      }

      // 2. Criar conversa
      const conversationResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          instanceId: formData.instanceId,
          type: "BUSINESS_INITIATED",
        }),
      })

      const conversationData: CreateConversationResponse = await conversationResponse.json()

      if (!conversationResponse.ok || !conversationData.success) {
        throw new Error(conversationData.error || "Erro ao criar conversa")
      }

      // 3. Enviar mensagem
      const sendResponse = await fetch("/api/whatsapp/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: formData.instanceId,
          to: phoneFormatted,
          type: "text",
          text: formData.message,
        }),
      })

      const sendData = await sendResponse.json()

      if (!sendResponse.ok || !sendData.success) {
        throw new Error(sendData.error || "Erro ao enviar mensagem")
      }

      setStep("success")
      toast.success("Conversa iniciada com sucesso!", {
        description: `Mensagem enviada para ${formData.name || phoneFormatted}`,
      })

      // Aguarda um momento e redireciona
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
        
        // Redireciona para a conversa
        const conversationId = conversationData.data?.id
        if (conversationId) {
          router.push(`/conversas?id=${conversationId}`)
        }
      }, 1500)

    } catch (error) {
      console.error("Erro ao criar conversa:", error)
      setStep("error")
      toast.error("Erro ao iniciar conversa", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    }
  }

  // Verifica se há canais disponíveis
  const hasChannels = connectedInstances.length > 0

  const renderContent = () => {
    switch (step) {
      case "sending":
        return (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#46347F]" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Iniciando conversa...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Criando contato, conversa e enviando mensagem
              </p>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Conversa iniciada!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Redirecionando...
              </p>
            </div>
          </div>
        )

      case "error":
        return (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Erro ao iniciar conversa</p>
              <p className="text-xs text-muted-foreground mt-1">
                Verifique os dados e tente novamente
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep("form")}>
              Tentar novamente
            </Button>
          </div>
        )

      default:
        return (
          <div className="space-y-5">
            {/* Canal (WhatsApp Instance) */}
            <div className="space-y-2">
              <Label htmlFor="instance">
                <MessageCircle className="h-4 w-4 inline mr-1" />
                Canal WhatsApp *
              </Label>
              <Select
                value={formData.instanceId}
                onValueChange={(value) => {
                  setFormData({ ...formData, instanceId: value })
                  setErrors({ ...errors, instanceId: "" })
                }}
                disabled={loadingInstances || !hasChannels}
              >
                <SelectTrigger id="instance" className={errors.instanceId ? "border-red-500" : ""}>
                  <SelectValue placeholder={
                    loadingInstances 
                      ? "Carregando canais..." 
                      : hasChannels 
                        ? "Selecione o canal" 
                        : "Nenhum canal conectado"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {connectedInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">●</span>
                        {instance.name || instance.displayPhoneNumber || instance.phoneNumber}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.instanceId && (
                <p className="text-xs text-red-500">{errors.instanceId}</p>
              )}
              {!hasChannels && !loadingInstances && (
                <p className="text-xs text-amber-600">
                  Nenhum canal WhatsApp conectado.{" "}
                  <a href="/integracoes/whatsapp-oficial" className="underline hover:text-amber-700">
                    Conectar agora
                  </a>
                </p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone (WhatsApp) *
              </Label>
              <Input
                id="phone"
                placeholder="5511999999999"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value })
                  setErrors({ ...errors, phone: "" })
                }}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone ? (
                <p className="text-xs text-red-500">{errors.phone}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Formato internacional: código do país + DDD + número
                </p>
              )}
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="h-4 w-4 inline mr-1" />
                Nome do contato
              </Label>
              <Input
                id="name"
                placeholder="Nome do cliente (opcional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Se não informado, usaremos o número como identificação
              </p>
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem inicial *</Label>
              <Textarea
                id="message"
                placeholder="Digite a mensagem que será enviada..."
                rows={3}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value })
                  setErrors({ ...errors, message: "" })
                }}
                className={errors.message ? "border-red-500" : ""}
              />
              {errors.message && (
                <p className="text-xs text-red-500">{errors.message}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={step !== "form"}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasChannels || step !== "form"}
                className="bg-[#46347F] hover:bg-[#8886d4] text-white"
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Iniciar Conversa
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-[#46347F]" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Inicie uma nova conversa via WhatsApp com um cliente
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
