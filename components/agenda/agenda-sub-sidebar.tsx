"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  CalendarDays,
  Phone,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  BarChart3,
  ListTodo,
  CalendarCheck,
  Target,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAgendamentos } from "@/lib/contexts/agendamentos-context"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: "Visão Geral", href: "/agendamentos", icon: BarChart3 },
  { label: "Concluídas", href: "/agendamentos/concluidas", icon: CheckCircle2 },
]

const tiposNavItems: NavItem[] = [
  { label: "Ligações", href: "/agendamentos/ligacoes", icon: Phone, badge: 3 },
  { label: "Reuniões", href: "/agendamentos/reunioes", icon: Users, badge: 5 },
  { label: "Tarefas", href: "/agendamentos/tarefas", icon: FileText, badge: 4 },
  { label: "Prazos", href: "/agendamentos/prazos", icon: Clock, badge: 1 },
]

// Configurações removidas conforme solicitação (Metas, Disponibilidade, Configurações)
const configNavItems: NavItem[] = []

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

export function AgendaSubSidebar() {
  const pathname = usePathname()
  const { abrirModalNovaAtividade } = useAgendamentos()

  return (
    <aside className="h-full w-[220px] border-0 bg-background shadow-sm">
      <div className="flex h-full flex-col">
        {/* Header com botão Nova Atividade */}
        <div className="border-0 px-4 py-4">
          <button
            onClick={abrirModalNovaAtividade}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9795e4] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7c7ab8]"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavSection title="Principal" items={mainNavItems} pathname={pathname} />
          <NavSection title="Tipos" items={tiposNavItems} pathname={pathname} />
          {/* Configurações removidas conforme solicitação */}
          {/* <NavSection title="Configurações" items={configNavItems} pathname={pathname} /> */}
        </div>

        {/* Footer com resumo da semana */}
        <div className="border-0 p-4">
          <div className="rounded-lg bg-[#9795e4]/10 p-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#9795e4]" />
              <p className="text-xs font-medium text-[#7b79c4]">
                Esta Semana
              </p>
            </div>
            <p className="text-xs text-[#7b79c4]/80 mt-1">
              13 atividades agendadas
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
