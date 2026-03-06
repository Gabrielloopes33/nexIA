"use client"

import { useState, useEffect, useCallback } from "react"

interface UseMainSidebarReturn {
  isCollapsed: boolean
  isReady: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

const STORAGE_KEY = "main_sidebar_collapsed"

export function useMainSidebar(): UseMainSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Read from localStorage during mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setIsCollapsed(JSON.parse(stored))
      }
    } catch {
      // Fallback to default if localStorage is not available
    }
    // Mark as ready after state is set
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isReady) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [isCollapsed, isReady])

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setIsCollapsed(value)
  }, [])

  return {
    isCollapsed,
    isReady,
    toggle,
    setCollapsed,
  }
}
