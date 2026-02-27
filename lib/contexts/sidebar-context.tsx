'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type NavItemKey = 
  | 'overview' 
  | 'conversas' 
  | 'canais' 
  | 'pipeline' 
  | 'agendamentos' 
  | 'contatos' 
  | 'integracoes' 
  | 'automacoes'
  | 'cobrancas'
  | 'loja'
  | 'configuracoes'

interface SubSidebarContextType {
  isOpen: boolean
  activeNavItem: NavItemKey | null
  isAnimating: boolean
  sidebarWidth: number
  togglePanel: (item: NavItemKey) => void
  closePanel: () => void
  openPanel: (item: NavItemKey) => void
}

const SubSidebarContext = createContext<SubSidebarContextType | undefined>(undefined)

export function SubSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState<NavItemKey | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(0)

  const togglePanel = (item: NavItemKey) => {
    setIsAnimating(true)
    
    if (activeNavItem === item && isOpen) {
      // Fechar
      setSidebarWidth(0)
      setTimeout(() => {
        setIsOpen(false)
        setActiveNavItem(null)
        setIsAnimating(false)
      }, 200)
    } else {
      // Abrir
      setIsOpen(true)
      setActiveNavItem(item)
      setTimeout(() => {
        setSidebarWidth(200)
        setIsAnimating(false)
      }, 10)
    }
  }

  const closePanel = () => {
    setIsAnimating(true)
    setSidebarWidth(0)
    setTimeout(() => {
      setIsOpen(false)
      setActiveNavItem(null)
      setIsAnimating(false)
    }, 200)
  }

  const openPanel = (item: NavItemKey) => {
    setIsAnimating(true)
    setIsOpen(true)
    setActiveNavItem(item)
    setTimeout(() => {
      setSidebarWidth(200)
      setIsAnimating(false)
    }, 10)
  }

  return (
    <SubSidebarContext.Provider 
      value={{ isOpen, activeNavItem, isAnimating, sidebarWidth, togglePanel, closePanel, openPanel }}
    >
      {children}
    </SubSidebarContext.Provider>
  )
}

export function useSubSidebar() {
  const context = useContext(SubSidebarContext)
  if (context === undefined) {
    throw new Error('useSubSidebar must be used within a SubSidebarProvider')
  }
  return context
}

// Hook adicional para ouvir mudanças de largura
export function useSidebarWidth(): number {
  const context = useContext(SubSidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarWidth must be used within a SubSidebarProvider')
  }
  return context.sidebarWidth
}
