"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  Plug,
  Phone,
  FileText,
  Webhook,
  BarChart3,
  Settings,
  HelpCircle,
  Shield,
  AlertCircle,
  Send,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWhatsApp } from "@/hooks/use-whatsapp"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  disabled?: boolean
}

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
                  : "text-foreground/70 hover:bg-accent hover:text-foreground",
                item.disabled && "pointer-events-none opacity-50"
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

export function WhatsAppSubSidebar() {
  const pathname = usePathname()
  const { status } = useWhatsApp()
  
  const isConnected = status === 'connected'

  const mainNavItems: NavItem[] = [
    { 
      label: "Visão Geral", 
      href: "/integracoes/whatsapp", 
      icon: MessageSquare 
    },
    { 
      label: "Conectar", 
      href: "/integracoes/whatsapp/connect", 
      icon: Plug,
      badge: !isConnected ? 1 : undefined,
    },
  ]

  const manageNavItems: NavItem[] = [
    { 
      label: "Números", 
      href: "/integracoes/whatsapp/numeros", 
      icon: Phone,
      disabled: !isConnected,
    },
    { 
      label: "Templates", 
      href: "/integracoes/whatsapp/templates", 
      icon: FileText,
      disabled: !isConnected,
    },
    { 
      label: "Enviar", 
      href: "/integracoes/whatsapp/send", 
      icon: Send,
      disabled: !isConnected,
    },
    { 
      label: "Webhooks", 
      href: "/integracoes/whatsapp/webhooks", 
      icon: Webhook,
      disabled: !isConnected,
    },
    { 
      label: "Logs", 
      href: "/integracoes/whatsapp/logs", 
      icon: ScrollText,
      disabled: !isConnected,
    },
  ]

  const analyticsNavItems: NavItem[] = [
    { 
      label: "Analytics", 
      href: "/integracoes/whatsapp/analytics", 
      icon: BarChart3,
      disabled: !isConnected,
    },
  ]

  const supportNavItems: NavItem[] = [
    { 
      label: "Compliance", 
      href: "/integracoes/whatsapp-compliance", 
      icon: Shield,
      disabled: !isConnected,
    },
    { 
      label: "Configurações", 
      href: "/integracoes/whatsapp-settings", 
      icon: Settings,
      disabled: !isConnected,
    },
  ]

  return (
    <div className="sub-sidebar flex h-full w-[220px] flex-shrink-0 flex-col border-r-2 border-border bg-background">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b-2 border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#25D366]">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">WhatsApp</h2>
            <p className="text-xs text-muted-foreground">Business API</p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className={cn(
          "mt-1 flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs",
          isConnected 
            ? "bg-emerald-50 text-emerald-700" 
            : "bg-amber-50 text-amber-700"
        )}>
          <span className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-emerald-500" : "bg-amber-500"
          )} />
          {isConnected ? "Conectado" : "Não Conectado"}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <NavSection title="Principal" items={mainNavItems} pathname={pathname} />
        <NavSection title="Gerenciar" items={manageNavItems} pathname={pathname} />
        <NavSection title="Analytics" items={analyticsNavItems} pathname={pathname} />
        <NavSection title="Suporte" items={supportNavItems} pathname={pathname} />
      </div>

      {/* Footer - Compliance Notice */}
      <div className="border-t-2 border-border p-4">
        <div className="rounded-sm bg-[#9795e4]/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9795e4]" />
            <div>
              <p className="text-xs font-medium text-foreground">Compliance</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Siga as diretrizes da Meta para evitar bloqueios
              </p>
              <a 
                href="https://business.whatsapp.com/policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-[#9795e4] hover:underline"
              >
                Ver políticas
                <HelpCircle className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
