"use client"

import { useState, useEffect } from "react"

interface UseMainSidebarReturn {
  isReady: boolean
}

export function useMainSidebar(): UseMainSidebarReturn {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Mark as ready after mount for hydration safety
    setIsReady(true)
  }, [])

  return {
    isReady,
  }
}
