"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Tags,
  Layers,
  Settings,
  BarChart3,
  Mail,
  Download,
  Trash2,
  Database,
  FileSpreadsheet,
  UserPlus,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: "Todos os Contatos", href: "/contatos", icon: Users },
  { label: "Listas", href: "/contatos/listas", icon: List },
]

const manageNavItems: NavItem[] = [
  { label: "Segmentos", href: "/contatos/segmentos", icon: Layers },
  { label: "Tags", href: "/contatos/tags", icon: Tags },
  { label: "Campos", href: "/contatos/campos", icon: Settings },
  { label: "Pontuação", href: "/contatos/pontuacao", icon: BarChart3 },
]

const dataNavItems: NavItem[] = [
  { label: "Importar", href: "/contatos/importar", icon: Download },
  { label: "Exportar", href: "/contatos/exportar", icon: FileSpreadsheet },
  { label: "Inscrições por Email", href: "/contatos/inscricoes", icon: Mail },
  { label: "Lixeira", href: "/contatos/lixeira", icon: Trash2, badge: 0 },
]

const reportNavItems: NavItem[] = [
  { label: "Tendências de Contatos", href: "/contatos/relatorios/tendencias", icon: BarChart3 },
  { label: "Desempenho de Contatos", href: "/contatos/relatorios/desempenho", icon: BarChart3 },
  { label: "Análise Detalhada", href: "/contatos/relatorios/analise", icon: Database },
  { label: "Contatos Globalizados", href: "/contatos/relatorios/global", icon: Database },
  { label: "Existência na Lista", href: "/contatos/relatorios/existencia", icon: List },
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

export function ContactsSubSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-[72px] top-0 z-30 h-screen w-[220px] border-r border-border bg-background pt-[72px]">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 py-4">
          <Link
            href="/contatos/novo"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9795e4] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7c7ab8]"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Contato
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavSection title="Principal" items={mainNavItems} pathname={pathname} />
          <NavSection title="Gerenciar" items={manageNavItems} pathname={pathname} />
          <NavSection title="Dados" items={dataNavItems} pathname={pathname} />
          <NavSection title="Relatórios" items={reportNavItems} pathname={pathname} />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-[#9795e4]/5 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-[#9795e4]">Dica:</span> Use tags para organizar seus contatos
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
