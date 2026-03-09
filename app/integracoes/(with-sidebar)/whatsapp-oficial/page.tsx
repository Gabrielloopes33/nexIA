"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Info,
  MessageSquare,
  Shield,
  Verified,
  Zap,
  Globe,
  Webhook
} from "lucide-react"
import Link from "next/link"

export default function WhatsAppOficialPage() {
  return (
    <>
      {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/integracoes" className="hover:text-[#9795e4] transition-colors">
              Integrações
            </Link>
            <span>/</span>
            <span>WhatsApp Oficial</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#25D366]/10">
                <Smartphone className="h-6 w-6 text-[#25D366]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">WhatsApp Oficial</h1>
                <p className="text-sm text-muted-foreground">
                  API oficial do WhatsApp Business via Meta
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#9795e4]/10 text-[#9795e4] hover:bg-[#9795e4]/20">
                <Verified className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Não Conectado
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-[#9795e4]/20 bg-[#9795e4]/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Verified className="h-5 w-5 flex-shrink-0 text-[#9795e4] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#9795e4]">API Oficial da Meta</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Esta é a integração oficial aprovada pela Meta. Oferece máxima confiabilidade, 
                suporte a templates pré-aprovados e possibilidade de obter o selo Green Tick.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[#9795e4]" />
                Como funciona
              </CardTitle>
              <CardDescription>
                Processo de conexão com a API oficial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10">
                  <Globe className="h-4 w-4 text-[#9795e4]" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Conta Meta Business</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecte sua conta Meta Business verificada para autorizar 
                    o acesso à API do WhatsApp Business.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10">
                  <Shield className="h-4 w-4 text-[#9795e4]" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Verificação de Negócio</h4>
                  <p className="text-sm text-muted-foreground">
                    Sua empresa passa por verificação da Meta para garantir 
                    segurança e autenticidade.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9795e4]/10">
                  <Webhook className="h-4 w-4 text-[#9795e4]" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Webhooks Oficiais</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real através dos webhooks 
                    oficiais da Meta com máxima confiabilidade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#9795e4]" />
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
                    <XCircle className="h-4 w-4 text-red-500" />
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
                <MessageSquare className="h-5 w-5 text-[#9795e4]" />
                Recursos Exclusivos
              </CardTitle>
              <CardDescription>
                Funcionalidades disponíveis apenas na API oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { 
                    title: "Templates Pré-aprovados", 
                    desc: "Envie mensagens fora da janela de 24h com templates aprovados pela Meta",
                    icon: Verified 
                  },
                  { 
                    title: "Green Tick", 
                    desc: "Possibilidade de obter o selo de verificação oficial da Meta",
                    icon: Shield 
                  },
                  { 
                    title: "Mensagens em Massa", 
                    desc: "Broadcasts para múltiplos contatos de forma oficial",
                    icon: MessageSquare 
                  },
                  { 
                    title: "Webhooks Avançados", 
                    desc: "Notificações em tempo real de qualidade, limites e status",
                    icon: Webhook 
                  },
                  { 
                    title: "Analytics", 
                    desc: "Métricas detalhadas de entrega, leitura e engajamento",
                    icon: Info 
                  },
                  { 
                    title: "Alta Confiabilidade", 
                    desc: "Infraestrutura da Meta com 99.9% de uptime garantido",
                    icon: CheckCircle2 
                  },
                  { 
                    title: "Suporte Oficial", 
                    desc: "Acesso ao suporte técnico direto da Meta",
                    icon: Zap 
                  },
                  { 
                    title: "Conformidade Total", 
                    desc: "100% em conformidade com as políticas do WhatsApp",
                    icon: Shield 
                  },
                ].map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-lg border border-[#9795e4]/20 bg-[#9795e4]/5 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <feature.icon className="h-4 w-4 text-[#9795e4]" />
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="md:col-span-2 bg-gradient-to-r from-[#9795e4]/10 to-transparent border-[#9795e4]/30">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <div>
                <h3 className="font-semibold text-lg">Pronto para usar o WhatsApp Oficial?</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte sua conta Meta Business e aproveite todos os recursos oficiais.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/integracoes/whatsapp-nao-oficial">
                    Ver Não Oficial
                  </Link>
                </Button>
                <Button className="bg-[#9795e4] hover:bg-[#7c7ab8]">
                  <Zap className="h-4 w-4 mr-2" />
                  Conectar Oficial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
