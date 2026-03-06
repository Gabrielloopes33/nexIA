"use client"

import { useState, useEffect, useCallback } from "react"

interface UseMainSidebarReturn {
  isCollapsed: boolean
  isReady: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

const STORAGE_KEY = "main_sidebar_collapsed"

// Read localStorage synchronously to prevent flash
function getInitialCollapsedState(): boolean {
  if (typeof window === "undefined") return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? JSON.parse(stored) : false
  } catch {
    return false
  }
}

export function useMainSidebar(): UseMainSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsedState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Mark as ready after mount
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
