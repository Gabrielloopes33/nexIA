"use client"

import { useState, useEffect, useCallback } from "react"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useContactsSidebar } from "@/hooks/use-contacts-sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

]

const dataNavItems: NavItem[] = [
  { label: "Importar", href: "/contatos/importar", icon: Download },
  { label: "Exportar", href: "/contatos/exportar", icon: FileSpreadsheet },

  { label: "Lixeira", href: "/contatos/lixeira", icon: Trash2, badge: 0 },
]

const reportNavItems: NavItem[] = [
  { label: "Tendências de Contatos", href: "/contatos/relatorios/tendencias", icon: BarChart3 },
  { label: "Desempenho de Contatos", href: "/contatos/relatorios/desempenho", icon: BarChart3 },
]

// Hook local para persistir estado


interface NavSectionProps {
  title: string
  items: NavItem[]
  pathname: string
  isCollapsed: boolean
}

function NavSection({ title, items, pathname, isCollapsed }: NavSectionProps) {
  return (
    <div className={cn("mb-6", isCollapsed && "mb-4")}>
      <h4
        className={cn(
          "mb-2 px-3 text-xs font-bold uppercase tracking-wider text-[#9795e4] transition-all duration-300 ease-in-out",
          isCollapsed && "opacity-0 h-0 mb-0 overflow-hidden"
        )}
        aria-hidden={isCollapsed}
      >
        {title}
      </h4>
      <nav className={cn("space-y-0.5", isCollapsed && "space-y-1")}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md text-sm transition-all duration-300 ease-in-out",
                isActive
                  ? "bg-[#9795e4]/10 font-semibold text-[#9795e4]"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground",
                isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"
              )}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out",
                  isActive ? "text-[#9795e4]" : "text-foreground/60",
                  isCollapsed && "group-hover:scale-110"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex-1 whitespace-nowrap transition-all duration-300 ease-in-out",
                  isCollapsed && "opacity-0 w-0 overflow-hidden hidden"
                )}
              >
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#9795e4] px-1.5 text-xs font-medium text-white transition-opacity duration-300">
                  {item.badge}
                </span>
              )}
            </Link>
          )

          // Wrap with tooltip when collapsed
          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-popover text-popover-foreground border shadow-sm"
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9795e4] px-1 text-[10px] font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          }

          return linkContent
        })}
      </nav>
    </div>
  )
}

export function ContactsSubSidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useContactsSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by rendering expanded state initially
  if (!mounted) {
    return (
      <aside className="h-full w-[220px] border-0 bg-background shadow-sm">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-2 py-4" />
        </div>
      </aside>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-full border-0 bg-background shadow-sm transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[64px]" : "w-[220px]"
        )}
        aria-label="Navegação de Contatos"
        aria-expanded={!isCollapsed}
      >
        <div className="flex h-full flex-col">
          {/* Header com botão de toggle */}
          <div
            className={cn(
              "border-0 transition-all duration-300 ease-in-out",
              isCollapsed ? "px-2 py-2" : "px-4 py-4"
            )}
          >
            {/* Botão de Toggle */}
            <button
              onClick={toggle}
              className={cn(
                "flex items-center justify-center rounded-md transition-all duration-300 ease-in-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9795e4] focus-visible:ring-offset-2",
                isCollapsed
                  ? "h-8 w-full"
                  : "absolute -right-3 top-[88px] z-50 h-6 w-6 rounded-full bg-background border border-border shadow-sm hover:shadow-md"
              )}
              aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              aria-expanded={!isCollapsed}
              aria-controls="sidebar-content"
              title={isCollapsed ? "Expandir menu" : "Colapsar menu"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[#9795e4]" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-foreground/60" aria-hidden="true" />
              )}
            </button>

            {/* Botão Adicionar Contato */}
            <div className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "mt-8" : "mt-0")}>
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href="/contatos/novo"
                      className="flex h-9 w-full items-center justify-center rounded-md bg-[#9795e4] text-white transition-all duration-300 hover:bg-[#7c7ab8] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9795e4] focus-visible:ring-offset-2"
                      title="Adicionar Contato"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border shadow-sm">
                    Adicionar Contato
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href="/contatos/novo"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9795e4] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#7c7ab8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9795e4] focus-visible:ring-offset-2"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Adicionar Contato
                </Link>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div
            id="sidebar-content"
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out",
              isCollapsed ? "px-1.5 py-2" : "px-2 py-4"
            )}
          >
            <NavSection
              title="Principal"
              items={mainNavItems}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
            <NavSection
              title="Gerenciar"
              items={manageNavItems}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
            <NavSection
              title="Dados"
              items={dataNavItems}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
            <NavSection
              title="Relatórios"
              items={reportNavItems}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Footer - escondido quando colapsado */}
          <div
            className={cn(
              "border-0 transition-all duration-300 ease-in-out overflow-hidden",
              isCollapsed ? "opacity-0 h-0 p-0" : "opacity-100 p-4"
            )}
            aria-hidden={isCollapsed}
          >
            <div className="rounded-lg bg-[#9795e4]/5 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-[#9795e4]">Dica:</span> Use tags para organizar seus contatos
              </p>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
