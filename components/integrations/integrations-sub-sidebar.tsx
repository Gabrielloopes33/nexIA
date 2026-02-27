"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  Store,
  Mail,
  Globe,
  Clock,
  Filter,
  Headphones,
  Settings,
  Plus,
  Activity,
  Download,
  AlertCircle,
  AlertTriangle,
  Key,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: "Todas as Integrações", href: "/integracoes", icon: MessageSquare },
  { label: "Canais de Conversação", href: "/integracoes/channels", icon: MessageSquare },
  { label: "Infoprodutos", href: "/integracoes/infoproducts", icon: Store },
  { label: "E-mail", href: "/integracoes/email", icon: Mail },
]

const actionsNavItems: NavItem[] = [
  { label: "Webhooks", href: "/integracoes/webhooks", icon: Globe },
  { label: "Histórico de Logs", href: "/integracoes/logs", icon: Activity },
  { label: "Sincronização", href: "/integracoes/sync", icon: Clock },
  { label: "Filtros", href: "/integracoes/filters", icon: Filter },
]

const troubleshootingNavItems: NavItem[] = [
  { label: "Problemas de Conexão", href: "/integracoes/issues", icon: AlertCircle },
  { label: "Erros Comuns", href: "/integracoes/errors", icon: AlertTriangle },
  { label: "Suporte", href: "/integracoes/support", icon: Headphones },
]

const settingsNavItems: NavItem[] = [
  { label: "Configurações", href: "/integracoes/settings", icon: Settings },
  { label: "Token de Autenticação", href: "/integracoes/auth", icon: Key },
  { label: "Exportar Logs", href: "/integracoes/export", icon: Download },
]

interface NavSectionProps {
  title: string
  items: NavItem[]
  pathname: string
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  return (
    <div className="mb-5">
      <h4 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-[#9795e4]/10 font-semibold text-[#9795e4]"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-[#9795e4]" : "text-foreground/60")} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#9795e4] px-1.5 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function IntegrationsSubSidebar() {
  const pathname = usePathname()

  return (
    <div className="sub-sidebar flex h-full w-[220px] flex-shrink-0 flex-col border-r-2 border-border bg-background">
      {/* Header com botão Nova Integração */}
      <div className="flex flex-col gap-2 border-b-2 border-border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Integrações
        </h2>
        
        <Link
          href="/integracoes/nova"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nova Integração
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <NavSection title="Gerenciar" items={mainNavItems} pathname={pathname} />
        <NavSection title="Ações" items={actionsNavItems} pathname={pathname} />
        <NavSection title="Solução de Problemas" items={troubleshootingNavItems} pathname={pathname} />
        <NavSection title="Configurações" items={settingsNavItems} pathname={pathname} />
      </div>

      {/* Footer */}
      <div className="border-t-2 border-border p-4">
        <div className="rounded-sm bg-[#9795e4]/5 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-[#9795e4]">Dica:</span> Gerencie suas conexões e configure as integrações
          </p>
        </div>
      </div>
    </div>
  )
}
