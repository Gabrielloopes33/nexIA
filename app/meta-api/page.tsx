"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Instagram, 
  Shield, 
  Settings,
  MessageSquare,
  Verified,
  Zap,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface ApiCardProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: string
  features: string[]
}

function ApiCard({ title, description, icon: Icon, href, color, badge, features }: ApiCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg hover:border-[#46347F]/30">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          {badge && (
            <Badge className="bg-[#46347F]/10 text-[#46347F] hover:bg-[#46347F]/20">
              <Verified className="h-3 w-3 mr-1" />
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-[#46347F]" />
              {feature}
            </li>
          ))}
        </ul>
        <Button className="w-full bg-[#46347F] hover:bg-[#46347F]/90" asChild>
          <Link href={href}>
            Acessar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function MetaApiLandingPage() {
  const apis = [
    {
      title: "WhatsApp Business API",
      description: "API oficial do WhatsApp Business via Meta. Envie mensagens, gerencie templates e obtenha métricas em tempo real.",
      icon: Smartphone,
      href: "/meta-api/whatsapp",
      color: "#25D366",
      badge: "Oficial",
      features: [
        "Envio de mensagens em massa",
        "Templates pré-aprovados",
        "Webhooks em tempo real",
        "Analytics detalhado"
      ]
    },
    {
      title: "Instagram Business API",
      description: "Integração com Instagram Business. Gerencie conversas, comentários e mídias diretamente pela API.",
      icon: Instagram,
      href: "/integracoes/instagram",
      color: "#E4405F",
      badge: "Oficial",
      features: [
        "Mensagens diretas",
        "Gestão de comentários",
        "Stories e mídias",
        "Mencões e tags"
      ]
    },
    {
      title: "Compliance",
      description: "Ferramentas de conformidade e políticas. Gerencie bloqueios, violações e qualidade da conta.",
      icon: Shield,
      href: "/meta-api/compliance",
      color: "#46347F",
      badge: "Segurança",
      features: [
        "Monitoramento de bloqueios",
        "Políticas da Meta",
        "Qualidade de número",
        "Histórico de violações"
      ]
    },
    {
      title: "Configurações",
      description: "Configure webhooks, tokens de acesso e gerencie as configurações da sua integração Meta.",
      icon: Settings,
      href: "/meta-api/configuracoes",
      color: "#6B7280",
      features: [
        "Webhooks e eventos",
        "Tokens de acesso",
        "Permissões da API",
        "Logs de integração"
      ]
    }
  ]

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#46347F]">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meta APIs</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas integrações oficiais com a Meta
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 border-[#46347F]/20 bg-[#46347F]/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Verified className="h-5 w-5 flex-shrink-0 text-[#46347F] mt-0.5" />
          <div>
            <h3 className="font-semibold text-[#46347F]">APIs Oficiais da Meta</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse todas as integrações oficiais aprovadas pela Meta em um só lugar. 
              WhatsApp Business, Instagram e ferramentas de compliance integradas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {apis.map((api, idx) => (
          <ApiCard key={idx} {...api} />
        ))}
      </div>

      {/* Quick Stats / Footer */}
      <Card className="mt-8 bg-gradient-to-r from-[#46347F]/10 to-transparent border-[#46347F]/30">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
          <div>
            <h3 className="font-semibold text-lg">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground">
              Consulte a documentação oficial da Meta para mais informações sobre as APIs.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="https://developers.facebook.com/docs/" target="_blank">
              <MessageSquare className="h-4 w-4 mr-2" />
              Documentação Meta
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
