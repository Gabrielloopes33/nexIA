"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Save,
  MessageSquare,
  Clock,
  Reply,
  Bell,
  User
} from "lucide-react"

export default function WhatsappSettingsPage() {
  const [autoReply, setAutoReply] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)
  const [typingIndicator, setTypingIndicator] = useState(true)
  
  const [businessHours, setBusinessHours] = useState({
    start: "09:00",
    end: "18:00",
  })
  
  const [autoReplyMessage, setAutoReplyMessage] = useState(
    "Olá! Recebemos sua mensagem e responderemos em breve. Horário de atendimento: 9h às 18h."
  )
  
  const [awayMessage, setAwayMessage] = useState(
    "Olá! No momento estamos fora do horário de atendimento. Retornaremos assim que possível."
  )

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Personalize o comportamento da integração WhatsApp
          </p>
        </div>
        <Button className="gap-2 bg-[#9795e4] hover:bg-[#7c7ab8]">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>

      {/* Geral */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#9795e4]" />
            Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resposta Automática</p>
              <p className="text-sm text-muted-foreground">
                Enviar mensagem automática ao receber contato
              </p>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Confirmação de Leitura</p>
              <p className="text-sm text-muted-foreground">
                Mostrar quando mensagens foram lidas
              </p>
            </div>
            <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Indicador de Digitação</p>
              <p className="text-sm text-muted-foreground">
                Mostrar quando o atendente está digitando
              </p>
            </div>
            <Switch checked={typingIndicator} onCheckedChange={setTypingIndicator} />
          </div>
        </CardContent>
      </Card>

      {/* Horário de Atendimento */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#9795e4]" />
            Horário de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input 
                type="time" 
                value={businessHours.start}
                onChange={(e) => setBusinessHours({...businessHours, start: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário de Término</Label>
              <Input 
                type="time" 
                value={businessHours.end}
                onChange={(e) => setBusinessHours({...businessHours, end: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens Automáticas */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Reply className="h-4 w-4 text-[#9795e4]" />
            Mensagens Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Mensagem de Boas-vindas</Label>
            <Textarea 
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enviada automaticamente ao receber uma nova mensagem
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mensagem de Ausência (Fora do Horário)</Label>
            <Textarea 
              value={awayMessage}
              onChange={(e) => setAwayMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enviada quando o cliente contacta fora do horário de atendimento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#9795e4]" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nova Mensagem</p>
              <p className="text-sm text-muted-foreground">
                Notificar quando receber mensagens novas
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mensagem Não Respondida</p>
              <p className="text-sm text-muted-foreground">
                Alertar após 30 minutos sem resposta
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Erro de Conexão</p>
              <p className="text-sm text-muted-foreground">
                Notificar quando houver falha na conexão
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
