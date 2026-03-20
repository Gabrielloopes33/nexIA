"use client"

import Link from "next/link"
import {
  User,
  Building2,
  Users,
  Shield,
  MessageSquare,
  Mail,
  Bell,
  Smartphone,
  Instagram,
  Webhook,
  CreditCard,
  FileText,
  Wallet,
  Database,
  ScrollText,
  Lock,
  Settings,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const PRIMARY_COLOR = "#46347F"

interface ConfigSection {
  title: string
  icon: React.ElementType
  items: {
    label: string
    href: string
    icon: React.ElementType
    description?: string
  }[]
}

const configSections: ConfigSection[] = [
  {
    title: "Conta",
    icon: User,
    items: [
      { label: "Perfil", href: "/configuracoes/perfil", icon: User, description: "Dados pessoais e avatar" },
      { label: "Empresa", href: "/configuracoes/empresa", icon: Building2, description: "Informações da organização atual" },
      { label: "Usuários", href: "/configuracoes/usuarios", icon: Users, description: "Gerenciar equipe" },
      { label: "Organizações", href: "/configuracoes/organizacoes", icon: Building2, description: "Trocar ou criar organizações" },
      { label: "Permissões", href: "#", icon: Shield, description: "Controle de acesso" },
    ],
  },
  {
    title: "Comunicação",
    icon: MessageSquare,
    items: [
      { label: "Canais", href: "/configuracoes/canais", icon: MessageSquare, description: "WhatsApp, email e mais" },
      { label: "Templates", href: "#", icon: Mail, description: "Mensagens pré-definidas" },
      { label: "Notificações", href: "/configuracoes/notificacoes", icon: Bell, description: "Preferências de alerta" },
    ],
  },
  {
    title: "Integrações",
    icon: Webhook,
    items: [
      { label: "WhatsApp", href: "#", icon: Smartphone, description: "Conexão WhatsApp Business" },
      { label: "Instagram", href: "#", icon: Instagram, description: "Conexão Instagram DM" },
      { label: "API", href: "#", icon: Webhook, description: "Chaves e documentação" },
    ],
  },
  {
    title: "Assinaturas",
    icon: CreditCard,
    items: [
      { label: "Planos", href: "#", icon: CreditCard, description: "Seu plano atual e upgrade" },
      { label: "Faturas", href: "#", icon: FileText, description: "Histórico de cobranças" },
      { label: "Pagamento", href: "#", icon: Wallet, description: "Métodos de pagamento" },
    ],
  },
  {
    title: "Sistema",
    icon: Settings,
    items: [
      { label: "Backup", href: "#", icon: Database, description: "Exportar dados" },
      { label: "Logs", href: "#", icon: ScrollText, description: "Auditoria de atividades" },
      { label: "Segurança", href: "#", icon: Lock, description: "2FA e sessões" },
    ],
  },
]

function ConfigCard({ section }: { section: ConfigSection }) {
  const SectionIcon = section.icon

  return (
    <Card className="shadow-sm rounded-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{ color: PRIMARY_COLOR }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-sm"
            style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
          >
            <SectionIcon className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
          </div>
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1">
          {section.items.map((item) => {
            const ItemIcon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors",
                  "hover:bg-gray-50"
                )}
              >
                <ItemIcon
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={{ color: `${PRIMARY_COLOR}99` }}
                />
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-gray-500 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 opacity-0 transition-all group-hover:opacity-100"
                  style={{ color: PRIMARY_COLOR }}
                />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: PRIMARY_COLOR }}>
          Configurações
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie suas preferências, integrações e dados da conta
        </p>
      </div>

      {/* Grid de Configurações */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configSections.map((section) => (
          <ConfigCard key={section.title} section={section} />
        ))}
      </div>
    </div>
  )
}
