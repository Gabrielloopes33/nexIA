"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, memo, useMemo } from "react"
import { User, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMainSidebar } from "@/hooks/use-main-sidebar"
import { useSidebarDropdowns } from "@/hooks/use-sidebar-dropdowns"
import { useOrganization } from "@/lib/contexts/organization-context"
import { SidebarDropdownGroup } from "@/components/sidebar-dropdown-group"
import {
  topNavItems,
  bottomNavItems,
  navItems,
  SidebarNavItem,
  SidebarNavChild,
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
      data-tour={item.key}
      className={cn(
        "flex w-full items-center rounded-lg py-2 gap-2.5 transition-all duration-200 ease-out relative group",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-white/30 text-white pl-4 pr-3 translate-x-1"
          : "text-white hover:bg-white/15 px-3 hover:translate-x-0.5"
      )}
    >
      {/* Active indicator bar - yellow with animation */}
      {isActive && (
        <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full origin-left animate-scale-in" />
      )}
      <Icon className={cn(
        "h-5 w-5 text-white shrink-0 transition-transform duration-200",
        isActive ? "scale-110" : "group-hover:scale-105"
      )} />
      <span className="flex-1 text-left text-[14px] font-medium text-white whitespace-nowrap overflow-hidden">
        {item.label}
      </span>
    </Link>
  )
}

// Separate component for dropdown items to prevent re-renders
const NavItemWithDropdown = memo(function NavItemWithDropdown({
  item,
  pathname,
  isGroupOpen,
  onToggle,
}: {
  item: (typeof topNavItems)[number]
  pathname: string
  isGroupOpen: boolean
  onToggle: () => void
}) {
  return (
    <SidebarDropdownGroup
      item={item}
      isOpen={isGroupOpen}
      onToggle={onToggle}
      pathname={pathname}
    />
  )
})

// Função para filtrar itens baseado na role
function filterNavItemsByRole(items: SidebarNavItem[], userRole: string | null): SidebarNavItem[] {
  if (!userRole) return items
  
  return items.map(item => {
    // Se o item pai tem requiredRole e o usuário não tem permissão, remove o item
    if (item.requiredRole && userRole !== item.requiredRole) {
      return null
    }
    
    // Filtra children se existirem
    if (item.children) {
      const filteredChildren = item.children.filter((child: SidebarNavChild) => {
        if (child.requiredRole && userRole !== child.requiredRole) {
          return false
        }
        return true
      })
      
      // Se todos os children foram filtrados, retorna null
      if (filteredChildren.length === 0) {
        return null
      }
      
      return { ...item, children: filteredChildren }
    }
    
    return item
  }).filter((item): item is SidebarNavItem => item !== null)
}

// Memoized sidebar to prevent unnecessary re-renders when parent state changes
export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isReady } = useMainSidebar()
  const { role } = useOrganization()
  const [mounted, setMounted] = useState(false)
  
  // Filtra os itens baseado na role do usuário
  const filteredNavItems = useMemo(() => filterNavItemsByRole(navItems, role), [role])
  const filteredTopNavItems = useMemo(() => filterNavItemsByRole(topNavItems, role), [role])
  
  const { openGroups, toggleGroup, isGroupOpen } = useSidebarDropdowns(filteredNavItems)

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

  // Memoized toggle handler for each nav item
  const createToggleHandler = useCallback((key: string) => {
    return () => toggleGroup(key)
  }, [toggleGroup])

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
          "flex flex-1 flex-col rounded-sm bg-[#46347F] py-4 relative px-2 items-stretch shadow-[4px_0_24px_rgba(0,0,0,0.18)] overflow-hidden",
          isReady && "transition-all duration-300 ease-in-out"
        )}
      >
        {/* Top navigation */}
        <nav className="flex flex-1 flex-col gap-1 w-full items-stretch overflow-y-auto sidebar-scroll">
          {filteredTopNavItems.map((item) => {
            const isItemActive =
              pathname === item.href ||
              (item.href && pathname.startsWith(item.href + "/"))
            const hasChildren = item.children && item.children.length > 0

            // Render dropdown group for items with children
            if (hasChildren) {
              return (
                <NavItemWithDropdown
                  key={item.key}
                  item={item}
                  isGroupOpen={isGroupOpen(item.key)}
                  onToggle={createToggleHandler(item.key)}
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
                  "flex items-center rounded-lg py-2 gap-2.5 transition-all duration-200 ease-out relative group",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-white/30 text-white pl-4 pr-3 translate-x-1"
                    : "text-white hover:bg-white/15 px-3 hover:translate-x-0.5"
                )}
              >
                {/* Active indicator bar - yellow with animation */}
                {isActive && (
                  <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full origin-left animate-scale-in" />
                )}
                <Icon className={cn(
                  "h-5 w-5 text-white shrink-0 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                <span className="text-[14px] font-medium text-white whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              </Link>
            )
          })}
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center rounded-lg py-2 gap-2.5 transition-all duration-200 ease-out relative text-white hover:bg-white/15 px-3 mt-1 group hover:scale-[1.02] active:scale-[0.98] hover:translate-x-0.5"
          >
            <LogOut className="h-5 w-5 text-white shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span className="text-[14px] font-medium text-white whitespace-nowrap overflow-hidden">
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
})
