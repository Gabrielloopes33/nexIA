"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// ─── Types Exportados ───────────────────────────────────────────────────────

export type TipoAtividade = "ligacao" | "reuniao" | "tarefa" | "prazo"
export type StatusAtividade = "confirmado" | "pendente" | "cancelado"

export interface Atividade {
  id: number
  scheduleId?: string // UUID original do banco
  titulo: string
  contato: string
  empresa: string
  data: Date
  horaInicio: string
  horaFim: string
  tipo: TipoAtividade
  status: StatusAtividade
  local?: string
  descricao?: string
  avatar: string
}

interface AgendamentosContextType {
  // Modal state
  modalNovaAtividadeAberta: boolean
  abrirModalNovaAtividade: () => void
  fecharModalNovaAtividade: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AgendamentosContext = createContext<AgendamentosContextType | undefined>(undefined)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AgendamentosProvider({ children }: { children: ReactNode }) {
  const [modalNovaAtividadeAberta, setModalNovaAtividadeAberta] = useState(false)

  const abrirModalNovaAtividade = useCallback(() => {
    setModalNovaAtividadeAberta(true)
  }, [])

  const fecharModalNovaAtividade = useCallback(() => {
    setModalNovaAtividadeAberta(false)
  }, [])

  return (
    <AgendamentosContext.Provider
      value={{
        modalNovaAtividadeAberta,
        abrirModalNovaAtividade,
        fecharModalNovaAtividade,
      }}
    >
      {children}
    </AgendamentosContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAgendamentos() {
  const context = useContext(AgendamentosContext)
  if (context === undefined) {
    throw new Error("useAgendamentos deve ser usado dentro de um AgendamentosProvider")
  }
  return context
}
