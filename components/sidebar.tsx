"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Globe,
  CalendarDays,
  Users,
  Plug,
  Wifi,
  Store,
  Settings,
  User,
  KanbanSquare,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubSidebar, type NavItemKey } from "@/lib/contexts/sidebar-context"

const topNavItems = [
  { key: "overview" as NavItemKey, label: "Overview", icon: LayoutDashboard, href: "/" },
  { key: "contatos" as NavItemKey, label: "Contatos", icon: Users, href: "/contatos" },
  { key: "conversas" as NavItemKey, label: "Conversas", icon: MessageSquare, href: "/conversas" },
  { key: "pipeline" as NavItemKey, label: "Pipeline", icon: KanbanSquare, href: "/pipeline" },
  { key: "agendamentos" as NavItemKey, label: "Agendamentos", icon: CalendarDays, href: "/agendamentos" },
  { key: "integracoes" as NavItemKey, label: "Integrações", icon: Plug, href: "/integracoes" },
  { key: "automacoes" as NavItemKey, label: "Automacoes", icon: Wifi, href: "/automacoes" },
  { key: "cobrancas" as NavItemKey, label: "Cobranças", icon: CreditCard, href: "/cobrancas" },
]

const bottomNavItems = [
  { key: "loja" as NavItemKey, label: "Loja", icon: Store, href: "/loja" },
  { key: "configuracoes" as NavItemKey, label: "Configuracoes", icon: Settings, href: "/configuracoes" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { togglePanel, activeNavItem } = useSubSidebar()

  const handleNavClick = (key: NavItemKey, href: string) => {
    // Navega diretamente sem abrir a sub-sidebar automaticamente
    router.push(href)
  }
  
  const handleRightClick = (e: React.MouseEvent, key: NavItemKey) => {
    e.preventDefault()
    togglePanel(key)
  }

  return (
    <div className="flex h-screen flex-col items-center py-4 pl-3">
      {/* Logo floating above */}
      <div className="mb-3 flex-shrink-0">
        <Link href="/">
          <Image
            src="/images/nexia-logo.png"
            alt="NexIA Chat"
            width={48}
            height={48}
            style={{ width: 48, height: "auto" }}
          />
        </Link>
      </div>

      {/* Pill-shaped sidebar container */}
      <div className="flex flex-1 flex-col items-center rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] px-2 py-4 border-r-2 border-white/20">
        {/* Top navigation icons */}
        <nav className="flex flex-1 flex-col items-center gap-1">
          {topNavItems.map((item) => {
            const isActive = pathname === item.href
            const isPanelActive = activeNavItem === item.key
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.key, item.href)}
                onContextMenu={(e) => handleRightClick(e, item.key)}
                title={item.label}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-200",
                  isActive
                    ? "bg-white/30 text-white"
                    : "text-white hover:bg-white/15",
                  isPanelActive && "ring-2 ring-white/40 scale-110"
                )}
              >
                <item.icon className="h-4 w-4 text-white" strokeWidth={2.0} />
              </button>
            )
          })}
        </nav>

        {/* Bottom navigation icons */}
        <div className="flex flex-col items-center gap-1 border-t border-white/20 pt-3">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            const isPanelActive = activeNavItem === item.key
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.key, item.href)}
                onContextMenu={(e) => handleRightClick(e, item.key)}
                title={item.label}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-sm transition-all",
                  isActive
                    ? "bg-white/30 text-white"
                    : "text-white hover:bg-white/15",
                  isPanelActive && "ring-2 ring-white/40"
                )}
              >
                <item.icon className="h-4 w-4 text-white" strokeWidth={2.0} />
              </button>
            )
          })}
        </div>
      </div>

      {/* User icon at bottom, outside the pill */}
      <div className="mt-3 flex-shrink-0">
        <button
          title="Perfil"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[#9795e4] transition-all hover:bg-[#9795e4]/10"
        >
          <User className="h-4 w-4" strokeWidth={2.0} />
        </button>
      </div>
    </div>
  )
}
