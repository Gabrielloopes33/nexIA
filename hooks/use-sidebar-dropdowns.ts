"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SidebarNavItem, isGroupActive } from "@/components/sidebar-nav-config"

interface UseSidebarDropdownsReturn {
  openGroups: Set<string>
  toggleGroup: (key: string) => void
  openGroup: (key: string) => void
  closeGroup: (key: string) => void
  isGroupOpen: (key: string) => boolean
}

export function useSidebarDropdowns(navItems: SidebarNavItem[]): UseSidebarDropdownsReturn {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const openGroup = useCallback((key: string) => {
    setOpenGroups((prev) => new Set([...prev, key]))
  }, [])

  const closeGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const isGroupOpen = useCallback(
    (key: string) => openGroups.has(key),
    [openGroups]
  )

  // Auto-open groups that contain the active route
  useEffect(() => {
    const activeKeys = navItems
      .filter((item) => isGroupActive(item, pathname))
      .map((item) => item.key)

    if (activeKeys.length > 0) {
      setOpenGroups((prev) => new Set([...prev, ...activeKeys]))
    }
  }, [pathname, navItems])

  return {
    openGroups,
    toggleGroup,
    openGroup,
    closeGroup,
    isGroupOpen,
  }
}
