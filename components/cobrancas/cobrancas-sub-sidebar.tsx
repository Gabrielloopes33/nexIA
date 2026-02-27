"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  CreditCard,
  Receipt,
  Package,
  History,
  Settings,
  FileText,
  Plus,
  BarChart3,
  Users,
  Wallet,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: "Visão Geral", href: "/cobrancas", icon: BarChart3 },
  { label: "Assinaturas", href: "/cobrancas/assinaturas", icon: Package },
  { label: "Faturas", href: "/cobrancas/faturas", icon: Receipt },
  { label: "Clientes", href: "/cobrancas/clientes", icon: Users },
]

const gestaoNavItems: NavItem[] = [
  { label: "Métodos de Pagamento", href: "/cobrancas/pagamentos", icon: CreditCard },
  { label: "Histórico", href: "/cobrancas/historico", icon: History },
  { label: "Reembolsos", href: "/cobrancas/reembolsos", icon: Wallet },
  { label: "Descontos", href: "/cobrancas/cupons", icon: Zap },
]

const configNavItems: NavItem[] = [
  { label: "Planos e Preços", href: "/cobrancas/planos", icon: Package },
  { label: "Taxas e Impostos", href: "/cobrancas/taxas", icon: FileText },
  { label: "Configurações", href: "/cobrancas/configuracoes", icon: Settings },
]

interface NavSectionProps {
  title: string
  items: NavItem[]
  pathname: string
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  return (
    <div className="mb-6">
      <h4 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-[#9795e4]">
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
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
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

export function CobrancasSubSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-[72px] top-0 z-30 h-screen w-[220px] border-0 bg-background pt-[72px] shadow-sm">
      <div className="flex h-full flex-col">
        {/* Header com botão Nova Assinatura */}
        <div className="border-0 px-4 py-4">
          <Link
            href="/cobrancas/nova"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9795e4] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7c7ab8]"
          >
            <Plus className="h-4 w-4" />
            Nova Assinatura
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavSection title="Principal" items={mainNavItems} pathname={pathname} />
          <NavSection title="Gestão" items={gestaoNavItems} pathname={pathname} />
          <NavSection title="Configurações" items={configNavItems} pathname={pathname} />
        </div>

        {/* Footer com status Stripe */}
        <div className="border-0 p-4">
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-medium text-green-700">
                Stripe Conectado
              </p>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Pagamentos ativos
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
