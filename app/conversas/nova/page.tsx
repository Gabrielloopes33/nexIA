"use client"

import { useState } from "react"
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
import { ArrowLeft, MessageSquarePlus, Send, User, Mail, Phone, Tag } from "lucide-react"
import { toast } from "sonner"

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: "📱" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "chat", label: "Chat Widget", icon: "💬" },
]

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-blue-600" },
  { value: "medium", label: "Média", color: "text-yellow-600" },
  { value: "high", label: "Alta", color: "text-orange-600" },
  { value: "urgent", label: "Urgente", color: "text-red-600" },
]

export default function NovaConversaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    channel: "",
    priority: "medium",
    tags: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular criação de conversa
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log para debug (dados mockados - não salva de verdade)
    console.log("[Nova Conversa] Dados do formulário:", formData)
    console.log("[Nova Conversa] Nota: Em ambiente com backend, a conversa seria criada aqui.")

    toast.success("Conversa iniciada com sucesso!", {
      description: `${formData.name} - Canal: ${CHANNELS.find(c => c.value === formData.channel)?.label}. (Dados mockados - não aparece na lista)`,
    })

    // Redirecionar para a página de conversas
    router.push("/conversas")
  }

  const handleCancel = () => {
    router.push("/conversas")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Chat Sub-Sidebar */}


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
                Inicie uma nova conversa com um cliente
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-[#9795e4]" />
                Dados da Conversa
              </CardTitle>
              <CardDescription>
                Preencha as informações para iniciar uma nova conversa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações do Contato */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Informações do Contato
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="h-4 w-4 inline mr-1" />
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Digite o nome do cliente"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channel">
                        Canal *
                      </Label>
                      <Select
                        value={formData.channel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, channel: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((channel) => (
                            <SelectItem key={channel.value} value={channel.value}>
                              <span className="mr-2">{channel.icon}</span>
                              {channel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 98765-4321"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
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
                    disabled={isSubmitting || !formData.name || !formData.channel}
                    className="bg-[#9795e4] hover:bg-[#8886d4] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
