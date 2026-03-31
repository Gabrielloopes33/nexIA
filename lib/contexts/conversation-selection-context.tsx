"use client"

/**
 * Conversation Selection Context
 * Gerencia o estado de seleção múltipla de conversas
 * Usado para ações em massa (atribuir, resolver, arquivar)
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"

interface ConversationSelectionContextType {
  // Estado
  selectedIds: Set<string>
  isSelectionMode: boolean
  
  // Ações
  toggleSelection: (id: string) => void
  selectOne: (id: string) => void
  selectMultiple: (ids: string[]) => void
  selectAll: (ids: string[]) => void
  deselectAll: () => void
  clearSelection: () => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  
  // Verificações
  isSelected: (id: string) => boolean
  hasSelection: boolean
  selectionCount: number
}

const ConversationSelectionContext = createContext<ConversationSelectionContextType | undefined>(
  undefined
)

interface ConversationSelectionProviderProps {
  children: React.ReactNode
}

export function ConversationSelectionProvider({ children }: ConversationSelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectOne = useCallback((id: string) => {
    setSelectedIds(new Set([id]))
    setIsSelectionMode(true)
  }, [])

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      ids.forEach((id) => newSet.add(id))
      return newSet
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
    setIsSelectionMode(true)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }, [])

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true)
  }, [])

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const hasSelection = useMemo(() => selectedIds.size > 0, [selectedIds])

  const selectionCount = useMemo(() => selectedIds.size, [selectedIds])

  const value = useMemo(
    () => ({
      selectedIds,
      isSelectionMode,
      toggleSelection,
      selectOne,
      selectMultiple,
      selectAll,
      deselectAll,
      clearSelection,
      enterSelectionMode,
      exitSelectionMode,
      isSelected,
      hasSelection,
      selectionCount,
    }),
    [
      selectedIds,
      isSelectionMode,
      toggleSelection,
      selectOne,
      selectMultiple,
      selectAll,
      deselectAll,
      clearSelection,
      enterSelectionMode,
      exitSelectionMode,
      isSelected,
      hasSelection,
      selectionCount,
    ]
  )

  return (
    <ConversationSelectionContext.Provider value={value}>
      {children}
    </ConversationSelectionContext.Provider>
  )
}

export function useConversationSelection(): ConversationSelectionContextType {
  const context = useContext(ConversationSelectionContext)
  if (context === undefined) {
    throw new Error(
      "useConversationSelection deve ser usado dentro de ConversationSelectionProvider"
    )
  }
  return context
}
