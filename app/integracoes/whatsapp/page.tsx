"use client"

import { Sidebar } from "@/components/sidebar"
import { WhatsAppSubSidebar } from "@/components/whatsapp/whatsapp-sub-sidebar"
import { ComplianceBannerList } from "@/components/whatsapp/shared/compliance-banner"
import { ConnectionStatusCard } from "@/components/whatsapp/connect/connection-status"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Phone, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { GENERAL_COMPLIANCE_MESSAGES } from "@/lib/whatsapp/compliance-messages"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Stats Card Component
interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  const trendColors = {
    up: "text-emerald-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className={cn("mt-1 text-xs", trend ? trendColors[trend] : "text-muted-foreground")}>
              {description}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#9795e4]/10">
            <Icon className="h-6 w-6 text-[#9795e4]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Action Card
interface QuickActionProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  disabled?: boolean
}

function QuickAction({ title, description, icon: Icon, href, disabled }: QuickActionProps) {
  return (
    <Link href={href} className={disabled ? "pointer-events-none" : ""}>
      <Card className={cn(
        "transition-all hover:shadow-md",
        disabled && "opacity-50"
      )}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              disabled ? "bg-muted" : "bg-[#9795e4]/10"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                disabled ? "text-muted-foreground" : "text-[#9795e4]"
              )} />
            </div>
            <div>
              <p className={cn(
                "font-medium",
                disabled && "text-muted-foreground"
              )}>
                {title}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <ArrowRight className={cn(
            "h-4 w-4",
            disabled ? "text-muted-foreground" : "text-[#9795e4]"
          )} />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function WhatsAppOverviewPage() {
  const { status, account } = useWhatsApp()
  const isConnected = status === 'connected'

  // Get relevant compliance messages
  const complianceMessages = GENERAL_COMPLIANCE_MESSAGES.slice(0, 2)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Sidebar */}
      <Sidebar />

      {/* WhatsApp Sub-Sidebar */}
      <WhatsAppSubSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Business</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie sua integração com a API oficial do WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Banner */}
        <div className="mb-6">
          <ComplianceBannerList messages={complianceMessages} />
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatusCard />
        </div>

        {/* Stats Grid - Only show if connected */}
        {isConnected && account && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Números Ativos"
              value={account.phoneNumbers.length.toString()}
              description="Total de números verificados"
              icon={Phone}
            />
            <StatCard
              title="Templates"
              value={account.messageTemplates.length.toString()}
              description="Templates criados"
              icon={FileText}
            />
            <StatCard
              title="Mensagens (30d)"
              value="15.4K"
              description="+12% vs mês anterior"
              icon={MessageSquare}
              trend="up"
            />
            <StatCard
              title="Taxa de Entrega"
              value="96.3%"
              description="Acima da média do setor"
              icon={TrendingUp}
              trend="up"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Ações Rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              title="Conectar Conta"
              description="Configure a integração com Facebook"
              icon={CheckCircle2}
              href="/integracoes/whatsapp/connect"
            />
            <QuickAction
              title="Gerenciar Números"
              description="Adicione ou remova números"
              icon={Phone}
              href="/integracoes/whatsapp/numeros"
              disabled={!isConnected}
            />
            <QuickAction
              title="Criar Template"
              description="Crie templates de mensagem"
              icon={FileText}
              href="/integracoes/whatsapp/templates"
              disabled={!isConnected}
            />
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#9795e4]" />
                <CardTitle className="text-lg">Dicas de Compliance</CardTitle>
              </div>
              <CardDescription>
                Mantenha sua conta em boa situação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Sempre obtenha consentimento antes de enviar mensagens
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Respeite a janela de 24 horas para mensagens de sessão
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Monitore a qualidade dos seus números regularmente
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Use templates aprovados fora da janela de 24h
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#9795e4]" />
                <CardTitle className="text-lg">Próximos Passos</CardTitle>
              </div>
              <CardDescription>
                Recomendações para otimizar sua integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {!isConnected ? (
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Conecte sua conta WhatsApp Business</span>
                    <Button size="sm" variant="link" className="h-auto p-0 text-[#9795e4]" asChild>
                      <Link href="/integracoes/whatsapp/connect">Ir</Link>
                    </Button>
                  </li>
                ) : (
                  <>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Conta conectada</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-[#9795e4]" />
                      <span>Configure webhooks para receber eventos</span>
                      <Button size="sm" variant="link" className="h-auto p-0 text-[#9795e4]" asChild>
                        <Link href="/integracoes/whatsapp/webhooks">Configurar</Link>
                      </Button>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-[#9795e4]" />
                      <span>Crie templates para mensagens fora da janela</span>
                      <Button size="sm" variant="link" className="h-auto p-0 text-[#9795e4]" asChild>
                        <Link href="/integracoes/whatsapp/templates">Criar</Link>
                      </Button>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
