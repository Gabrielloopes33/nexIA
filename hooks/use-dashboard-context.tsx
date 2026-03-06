"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type DateRange = {
  label: string
  startDate: Date
  endDate: Date
}

type DashboardContextType = {
  // Filtro de período
  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  // Filtro de usuários
  selectedUsers: string[]
  toggleUser: (userId: string) => void
  setSelectedUsers: (users: string[]) => void

  // Trigger para refresh de dados
  refreshTrigger: number
  refresh: () => void
}

export const DATE_RANGES = {
  last7days: {
    label: "Últimos 7 dias",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  },
  last30days: {
    label: "Últimos 30 dias",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  },
  thisMonth: {
    label: "Este mês",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  },
  lastMonth: {
    label: "Mês passado",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
  }
}

function getDefaultDateRange(): DateRange {
  return DATE_RANGES.last7days
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const toggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }, [])

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        dateRange,
        setDateRange,
        selectedUsers,
        toggleUser,
        setSelectedUsers,
        refreshTrigger,
        refresh
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)

  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }

  return context
}
