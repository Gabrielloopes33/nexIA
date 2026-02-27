"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  AtSign,
  Clock,
  FolderOpen,
  Flag,
  Inbox,
  Users,
  Store,
  Headphones,
  Tag,
  Globe,
  Settings,
  Plus,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: "Todas as Conversas", href: "/conversas", icon: MessageSquare },
  { label: "Menções", href: "/conversas/mentions", icon: AtSign },
  { label: "Não Atendidas", href: "/conversas/unattended", icon: Clock },
]

const foldersNavItems: NavItem[] = [
  { label: "Prioridade", href: "/conversas/folders/priority", icon: Flag, badge: 3 },
  { label: "Leads Inbox", href: "/conversas/folders/leads", icon: Inbox, badge: 12 },
]

const teamNavItems: NavItem[] = [
  { label: "Vendas", href: "/conversas/teams/sales", icon: Store },
  { label: "Suporte L1", href: "/conversas/teams/support", icon: Headphones },
]

const channelsNavItems: NavItem[] = [
  { label: "WhatsApp", href: "/conversas/channels/whatsapp", icon: MessageSquare },
  { label: "Instagram", href: "/conversas/channels/instagram", icon: Globe },
  { label: "Email", href: "/conversas/channels/email", icon: MessageSquare },
  { label: "Iframe", href: "/conversas/channels/iframe", icon: Globe },
]

const labelsNavItems: NavItem[] = [
  { label: "device-setup", href: "/conversas/labels/device-setup", icon: Tag },
  { label: "lead", href: "/conversas/labels/lead", icon: Tag },
  { label: "software", href: "/conversas/labels/software", icon: Tag },
]

interface NavSectionProps {
  title: string
  items: NavItem[]
  pathname: string
}

function NavSection({ title, items, pathname }: NavSectionProps) {
  return (
    <div className="mb-5">
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

export function ChatSubSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-[72px] top-0 z-30 h-screen w-[220px] border-r border-border bg-background pt-[72px]">
      <div className="flex h-full flex-col">
        {/* Header with New Conversation Button */}
        <div className="border-b border-border px-4 py-4">
          <Link
            href="/conversas/nova"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9795e4] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#7c7ab8]"
          >
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavSection title="Principal" items={mainNavItems} pathname={pathname} />
          <NavSection title="Pastas" items={foldersNavItems} pathname={pathname} />
          <NavSection title="Equipes" items={teamNavItems} pathname={pathname} />
          <NavSection title="Canais" items={channelsNavItems} pathname={pathname} />
          <NavSection title="Etiquetas" items={labelsNavItems} pathname={pathname} />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-[#9795e4]/5 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-[#9795e4]">Dica:</span> Use filtros para organizar suas conversas
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
