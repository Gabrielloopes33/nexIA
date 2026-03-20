"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  
  // Start with empty set for SSR consistency
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)
  const initialHydrationDone = useRef(false)
  const isToggling = useRef(false)

  // Initial hydration from localStorage - runs ONLY ONCE after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (initialHydrationDone.current) return
    
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setOpenGroups(new Set(JSON.parse(saved)))
      } catch {
        // Fallback to auto-open if parse fails
        const activeKeys = navItems
          .filter((item) => isGroupActive(item, pathname))
          .map((item) => item.key)
        setOpenGroups(new Set(activeKeys))
      }
    } else {
      // Auto-open groups that contain the active route
      const activeKeys = navItems
        .filter((item) => isGroupActive(item, pathname))
        .map((item) => item.key)
      setOpenGroups(new Set(activeKeys))
    }
    
    initialHydrationDone.current = true
    setIsHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - run only once on mount

  // Persist to localStorage when openGroups changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...openGroups]))
    }
  }, [openGroups, isHydrated])

  const toggleGroup = useCallback((key: string) => {
    // Prevent rapid successive toggles (debounce)
    if (isToggling.current) return
    isToggling.current = true
    
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      const wasOpen = prev.has(key)
      
      // If clicking the already open group, close it
      if (wasOpen) {
        newSet.delete(key)
      } else {
        // Accordion behavior: close others and open clicked
        newSet.clear()
        newSet.add(key)
      }
      
      return newSet
    })
    
    // Reset toggle lock after animation completes
    setTimeout(() => {
      isToggling.current = false
    }, 300)
  }, [])

  const openGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      newSet.add(key)
      return newSet
    })
  }, [])

  const closeGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
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
