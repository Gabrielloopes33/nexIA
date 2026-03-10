"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  QrCode,
  MessageSquare,
  Shield,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function WhatsAppNaoOficialPage() {
  return (
    <>
      {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/integracoes" className="hover:text-[#46347F] transition-colors">
              Integrações
            </Link>
            <span>/</span>
            <span>WhatsApp Não Oficial</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#25D366]/10">
                <Smartphone className="h-6 w-6 text-[#25D366]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">WhatsApp Não Oficial</h1>
                <p className="text-sm text-muted-foreground">
                  Integração via API não oficial (Evolution API)
                </p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
              Conectado
            </Badge>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-700">Atenção: API Não Oficial</h3>
              <p className="text-sm text-amber-600 mt-1">
                Esta integração utiliza métodos não oficiais para conectar ao WhatsApp. 
                Embora funcional, ela possui limitações e riscos comparados à API oficial da Meta.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[#46347F]" />
                Como funciona
              </CardTitle>
              <CardDescription>
                Entenda o funcionamento da integração não oficial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#46347F]/10">
                  <QrCode className="h-4 w-4 text-[#46347F]" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Conexão via QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code com seu WhatsApp para conectar instantaneamente, 
                    sem necessidade de aprovação da Meta.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#46347F]/10">
                  <Zap className="h-4 w-4 text-[#46347F]" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Evolution API</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilizamos a Evolution API para criar uma ponte entre seu WhatsApp 
                    e nossa plataforma de forma automatizada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#46347F]" />
                Oficial vs Não Oficial
              </CardTitle>
              <CardDescription>
                Compare as diferenças entre as integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Verificação Meta</span>
                  <div className="flex items-center gap-4">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Templates Pré-aprovados</span>
                  <div className="flex items-center gap-4">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Green Tick (Selo)</span>
                  <div className="flex items-center gap-4">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Mensagens em Massa</span>
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Setup Imediato</span>
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Custo Mensal</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">Gratuito</span>
                    <span className="text-muted-foreground">Pago</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Não Oficial
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Oficial
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#46347F]" />
                Recursos Disponíveis
              </CardTitle>
              <CardDescription>
                Funcionalidades disponíveis na integração não oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Mensagens de Texto", desc: "Envio e recebimento de mensagens", status: "available" },
                  { title: "Mídia", desc: "Imagens, vídeos, áudios e documentos", status: "available" },
                  { title: "Templates", desc: "Mensagens predefinidas", status: "available" },
                  { title: "Webhooks", desc: "Notificações em tempo real", status: "available" },
                  { title: "QR Code", desc: "Conexão simplificada", status: "available" },
                  { title: "Chat em Grupo", desc: "Leitura de mensagens em grupos", status: "limited" },
                  { title: "Status/Stories", desc: "Visualização de status", status: "unavailable" },
                  { title: "Ligações", desc: "Chamadas de voz/vídeo", status: "unavailable" },
                ].map((feature, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded-lg border p-4 ${
                      feature.status === 'available' 
                        ? 'border-green-500/20 bg-green-500/5' 
                        : feature.status === 'limited'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {feature.status === 'available' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : feature.status === 'limited' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <h4 className={`font-medium text-sm ${
                        feature.status === 'unavailable' ? 'text-muted-foreground' : ''
                      }`}>
                        {feature.title}
                      </h4>
                    </div>
                    <p className={`text-xs ${
                      feature.status === 'unavailable' ? 'text-muted-foreground/60' : 'text-muted-foreground'
                    }`}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="md:col-span-2 border-[#46347F]/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <div>
                <h3 className="font-semibold text-lg">Quer migrar para o WhatsApp Oficial?</h3>
                <p className="text-sm text-muted-foreground">
                  Obtenha mais recursos, confiabilidade e o selo verificado da Meta.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/integracoes">Ver Todas Integrações</Link>
                </Button>
                <Button className="bg-[#46347F] hover:bg-[#46347F]" asChild>
                  <Link href="/integracoes/whatsapp-oficial">
                    Conhecer Oficial
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
