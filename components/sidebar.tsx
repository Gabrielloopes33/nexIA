"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { User, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMainSidebar } from "@/hooks/use-main-sidebar"
import { useSidebarDropdowns } from "@/hooks/use-sidebar-dropdowns"
import { SidebarDropdownGroup } from "@/components/sidebar-dropdown-group"
import {
  topNavItems,
  bottomNavItems,
  navItems,
} from "@/components/sidebar-nav-config"

// Simple Nav Link Component (for items without children)
function SimpleNavLink({
  item,
  isActive,
}: {
  item: (typeof topNavItems)[number]
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "flex w-full items-center rounded-sm h-9 gap-3 transition-all duration-200 relative",
        isActive
          ? "bg-white/30 text-white pl-4 pr-3"
          : "text-white hover:bg-white/15 px-3"
      )}
    >
      {/* Active indicator bar - yellow */}
      {isActive && (
        <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full" />
      )}
      <Icon className="h-4 w-4 text-white shrink-0" />
      <span className="flex-1 text-left text-[13px] font-medium text-white whitespace-nowrap overflow-hidden">
        {item.label}
      </span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isReady } = useMainSidebar()
  const [mounted, setMounted] = useState(false)
  const { openGroups, toggleGroup, isGroupOpen } = useSidebarDropdowns(navItems)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Mark as mounted for hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn(
        "flex h-screen flex-col py-4 pl-3 sidebar-container w-[280px] flex-shrink-0",
        mounted && isReady && "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Logo */}
      <div className="mb-3 flex-shrink-0 px-1">
        <Link href="/dashboard" className="block">
          <Image
            src="/images/nexia-logo.png"
            alt="NexIA Chat"
            width={200}
            height={60}
            className="w-full h-auto max-w-[240px]"
            priority
          />
        </Link>
      </div>

      {/* Main sidebar container */}
      <div
        className={cn(
          "flex flex-1 flex-col rounded-sm bg-[#46347F] py-4 border-r-2 border-white/20 relative px-2 items-stretch shadow-[4px_0_24px_rgba(0,0,0,0.18)]",
          isReady && "transition-all duration-300 ease-in-out"
        )}
      >
        {/* Top navigation */}
        <nav className="flex flex-1 flex-col gap-1 w-full items-stretch overflow-y-auto">
          {topNavItems.map((item) => {
            const isItemActive =
              pathname === item.href ||
              (item.href && pathname.startsWith(item.href + "/"))
            const hasChildren = item.children && item.children.length > 0

            // Render dropdown group for items with children
            if (hasChildren) {
              return (
                <SidebarDropdownGroup
                  key={item.key}
                  item={item}
                  isOpen={isGroupOpen(item.key)}
                  onToggle={() => toggleGroup(item.key)}
                  pathname={pathname}
                />
              )
            }

            // Render simple link for items without children
            return (
              <SimpleNavLink
                key={item.key}
                item={item}
                isActive={isItemActive}
              />
            )
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="flex flex-col gap-1 border-t border-white/20 pt-3 w-full items-stretch">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href || "#"}
                className={cn(
                  "flex items-center rounded-sm h-9 gap-3 transition-all duration-200 relative",
                  isActive
                    ? "bg-white/30 text-white pl-4 pr-3"
                    : "text-white hover:bg-white/15 px-3"
                )}
              >
                {/* Active indicator bar - yellow */}
                {isActive && (
                  <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full" />
                )}
                <Icon className="h-4 w-4 text-white shrink-0" />
                <span className="text-[13px] font-medium text-white whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              </Link>
            )
          })}
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center rounded-sm h-9 gap-3 transition-all duration-200 relative text-white hover:bg-white/15 px-3 mt-1"
          >
            <LogOut className="h-4 w-4 text-white shrink-0" />
            <span className="text-[13px] font-medium text-white whitespace-nowrap overflow-hidden">
              Sair
            </span>
          </button>
        </div>
      </div>

      {/* User icon at bottom */}
      <div className="mt-2 flex-shrink-0">
        <button
          title="Perfil"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[#46347F] transition-all hover:bg-[#46347F]/10"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
