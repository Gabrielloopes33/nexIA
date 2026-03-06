"use client"

import { useMemo, useState, useEffect } from "react"
import { useDashboard } from "./use-dashboard-context"
import { ENRICHED_LEADS } from "@/lib/mock-leads-enriched"
import type { Contact } from "@/lib/types/contact"

// Tipo estendido para os dados do dashboard
export interface EnrichedLead extends Contact {
  /** Valor do negócio (para leads convertidos) */
  dealValue?: number
  /** Usuário que atualizou o lead */
  atualizadoPor?: string
}

interface UseFilteredDataResult {
  filteredLeads: EnrichedLead[]
  isLoading: boolean
  stats: {
    total: number
    newThisPeriod: number
    conversionRate: number
    avgTicket: number
  }
}

// Mapeamento de IDs de usuário para nomes
const USER_NAMES: Record<string, string> = {
  joao: "João Silva",
  maria: "Maria Santos",
  pedro: "Pedro Oliveira"
}

// Simula o campo atualizadoPor baseado no ID do lead (mock)
function getAtualizadoPor(leadId: number): string {
  const users = ["João Silva", "Maria Santos", "Pedro Oliveira"]
  return users[leadId % users.length]
}

// Verifica se um lead está convertido (tem receita ou negócios)
function isConverted(lead: Contact): boolean {
  return (lead.receita && lead.receita > 0) || (lead.negocios && lead.negocios > 0)
}

export function useFilteredData(): UseFilteredDataResult {
  const { dateRange, selectedUsers } = useDashboard()
  const [isLoading, setIsLoading] = useState(false)

  // Simula delay de loading quando filtros mudam
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [dateRange, selectedUsers])

  // Enriquece os dados mock com campos derivados
  const enrichedData: EnrichedLead[] = useMemo(() => {
    return ENRICHED_LEADS.map((lead) => ({
      ...lead,
      dealValue: lead.receita,
      atualizadoPor: getAtualizadoPor(lead.id)
    }))
  }, [])

  // Filtra leads baseado nos critérios
  const filteredLeads = useMemo(() => {
    return enrichedData.filter((lead) => {
      // Filtro de data
      const leadDate = new Date(lead.criadoEm)
      if (leadDate < dateRange.startDate || leadDate > dateRange.endDate) {
        return false
      }

      // Filtro de usuários (se houver seleção)
      if (selectedUsers.length > 0) {
        const selectedNames = selectedUsers.map(
          (id) => USER_NAMES[id]
        ).filter(Boolean)
        if (!lead.atualizadoPor || !selectedNames.includes(lead.atualizadoPor)) {
          return false
        }
      }

      return true
    })
  }, [enrichedData, dateRange, selectedUsers])

  // Calcula estatísticas
  const stats = useMemo(() => {
    const total = filteredLeads.length
    const converted = filteredLeads.filter((l) => isConverted(l)).length
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0

    const avgTicket =
      converted > 0
        ? Math.round(
            filteredLeads
              .filter((l) => isConverted(l))
              .reduce((sum, l) => sum + (l.dealValue || 0), 0) / converted
          )
        : 0

    return {
      total,
      newThisPeriod: total,
      conversionRate,
      avgTicket
    }
  }, [filteredLeads])

  return { filteredLeads, isLoading, stats }
}
