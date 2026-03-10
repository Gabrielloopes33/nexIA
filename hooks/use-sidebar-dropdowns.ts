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

const STORAGE_KEY = 'sidebar-open-groups'

export function useSidebarDropdowns(navItems: SidebarNavItem[]): UseSidebarDropdownsReturn {
  const pathname = usePathname()
  
  // Initialize from localStorage or auto-open active groups
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch {
          // Fallback to auto-open if parse fails
        }
      }
    }
    
    // Auto-open groups that contain the active route
    const activeKeys = navItems
      .filter((item) => isGroupActive(item, pathname))
      .map((item) => item.key)
    
    return new Set(activeKeys)
  })

  // Persist to localStorage when openGroups changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...openGroups]))
    }
  }, [openGroups])

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

  return {
    openGroups,
    toggleGroup,
    openGroup,
    closeGroup,
    isGroupOpen,
  }
}
