"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  MessageSquare,
  Globe,
  CalendarDays,
  Users,
  Plug,
  Store,
  Settings,
  User,
  KanbanSquare,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubSidebar, type NavItemKey } from "@/lib/contexts/sidebar-context"
import { useMainSidebar } from "@/hooks/use-main-sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const topNavItems = [
  { key: "overview" as NavItemKey, label: "Overview", icon: LayoutDashboard, href: "/" },
  { key: "contatos" as NavItemKey, label: "Contatos", icon: Users, href: "/contatos" },
  { key: "conversas" as NavItemKey, label: "Conversas", icon: MessageSquare, href: "/conversas" },
  { key: "pipeline" as NavItemKey, label: "Pipeline", icon: KanbanSquare, href: "/pipeline" },
  { key: "agendamentos" as NavItemKey, label: "Agendamentos", icon: CalendarDays, href: "/agendamentos" },
  { key: "integracoes" as NavItemKey, label: "Integrações", icon: Plug, href: "/integracoes" },
  { key: "cobrancas" as NavItemKey, label: "Cobranças", icon: CreditCard, href: "/cobrancas" },
]

const bottomNavItems = [
  { key: "loja" as NavItemKey, label: "Loja", icon: Store, href: "/loja" },
  { key: "configuracoes" as NavItemKey, label: "Configuracoes", icon: Settings, href: "/configuracoes" },
]

interface NavButtonProps {
  item: typeof topNavItems[0]
  isActive: boolean
  isPanelActive: boolean
  onClick: () => void
  onRightClick: (e: React.MouseEvent) => void
  isCollapsed: boolean
  mounted: boolean
}

function NavButton({ item, isActive, isPanelActive, onClick, onRightClick, isCollapsed, mounted }: NavButtonProps) {
  const button = (
    <button
      onClick={onClick}
      onContextMenu={onRightClick}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-sm",
        mounted && "transition-all duration-200",
        isCollapsed 
          ? "h-9 w-9 justify-center" 
          : "h-9 w-full justify-start px-3 gap-3",
        isActive
          ? "bg-white/30 text-white"
          : "text-white hover:bg-white/15",
        isPanelActive && "ring-2 ring-white/40"
      )}
    >
      <item.icon className="h-4 w-4 text-white shrink-0" strokeWidth={2.0} />
      {!isCollapsed && (
        <span className="text-xs font-medium text-white whitespace-nowrap overflow-hidden">
          {item.label}
        </span>
      )}
    </button>
  )

  if (isCollapsed) {
    const Icon = item.icon
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200 shadow-md flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#7573b8]" strokeWidth={2} />
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { togglePanel, activeNavItem } = useSubSidebar()
  const { isCollapsed, toggle } = useMainSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavClick = (href: string) => {
    router.push(href)
  }
  
  const handleRightClick = (e: React.MouseEvent, key: NavItemKey) => {
    e.preventDefault()
    togglePanel(key)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={cn(
          "flex h-screen flex-col py-4 pl-3",
          mounted && "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-[160px]"
        )}
      >
        {/* Logo */}
        <div className={cn("mb-2 flex-shrink-0", isCollapsed && "flex justify-center")}>
          <Link href="/">
            <Image
              src="/images/nexia-logo.png"
              alt="NexIA Chat"
              width={isCollapsed ? 36 : 40}
              height={isCollapsed ? 36 : 40}
              style={{ width: isCollapsed ? 36 : 40, height: "auto" }}
            />
          </Link>
        </div>

        {/* Main sidebar container */}
        <div className={cn(
          "flex flex-1 flex-col rounded-sm bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] py-4 border-r-2 border-white/20 relative",
          mounted && "transition-all duration-300 ease-in-out",
          isCollapsed ? "px-1.5 items-center" : "px-2 items-center xl:items-stretch"
        )}>
          
          {/* Toggle Button */}
          <button
            onClick={toggle}
            className={cn(
              "absolute -right-3 top-4 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm transition-all duration-200 hover:shadow-md hover:scale-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9795e4] focus-visible:ring-offset-2"
            )}
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            title={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-[#9795e4]" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-foreground/60" />
            )}
          </button>

          {/* Top navigation */}
          <nav className={cn(
            "flex flex-1 flex-col gap-1.5 w-full",
            isCollapsed ? "items-center" : "items-stretch"
          )}>
            {topNavItems.map((item) => {
              const isActive = pathname === item.href
              const isPanelActive = activeNavItem === item.key
              return (
                <NavButton
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  isPanelActive={isPanelActive}
                  onClick={() => handleNavClick(item.href)}
                  onRightClick={(e) => handleRightClick(e, item.key)}
                  isCollapsed={isCollapsed}
                  mounted={mounted}
                />
              )
            })}
          </nav>

          {/* Bottom navigation */}
          <div className={cn(
            "flex flex-col gap-1.5 border-t border-white/20 pt-3 w-full",
            isCollapsed ? "items-center" : "items-stretch"
          )}>
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href
              const isPanelActive = activeNavItem === item.key
              return (
                <NavButton
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  isPanelActive={isPanelActive}
                  onClick={() => handleNavClick(item.href)}
                  onRightClick={(e) => handleRightClick(e, item.key)}
                  isCollapsed={isCollapsed}
                  mounted={mounted}
                />
              )
            })}
          </div>
        </div>

        {/* User icon at bottom */}
        <div className={cn("mt-2 flex-shrink-0", isCollapsed && "flex justify-center")}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                title="Perfil"
                className={cn(
                  "flex items-center justify-center rounded-sm text-[#9795e4] transition-all hover:bg-[#9795e4]/10",
                  isCollapsed ? "h-9 w-9" : "h-8 w-8"
                )}
              >
                <User className="h-4 w-4" strokeWidth={2.0} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200 shadow-md flex items-center gap-2">
              <User className="h-4 w-4 text-[#7573b8]" strokeWidth={2} />
              Perfil
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
