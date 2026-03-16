"use client"

import { useMemo, useState, useEffect } from "react"
import { useDashboard } from "./use-dashboard-context"
import { useContacts } from "./use-contacts"
import { useOrganizationId } from "@/lib/contexts/organization-context"
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

// Simula o campo atualizadoPor baseado no ID do lead
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
  const organizationId = useOrganizationId() ?? ''
  const { contacts, isLoading: contactsLoading } = useContacts(organizationId)
  const [isLoading, setIsLoading] = useState(false)

  // Simula delay de loading quando filtros mudam
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [dateRange, selectedUsers])

  // Enriquece os dados reais com campos derivados
  const enrichedData: EnrichedLead[] = useMemo(() => {
    return contacts.map((contact) => ({
      ...contact,
      // Mapear campos do hook useContacts para o formato esperado
      id: typeof contact.id === 'string' ? parseInt(contact.id) || 0 : contact.id,
      nome: contact.name || 'Sem nome',
      email: contact.phone || 'sem@email.com', // Usar phone como fallback
      empresa: contact.metadata?.company as string || 'Sem empresa',
      cargo: contact.metadata?.jobTitle as string,
      telefone: contact.phone,
      fonte: (contact.metadata?.source as Contact['fonte']) || 'Manual',
      status: mapStatusToLegacy(contact.status),
      avatar: contact.avatarUrl || contact.name?.charAt(0).toUpperCase() || '?',
      criadoEm: contact.createdAt,
      atualizadoEm: contact.updatedAt,
      tags: contact.tags || [],
      // Campos enriquecidos
      dealValue: contact.metadata?.dealValue as number || 0,
      atualizadoPor: getAtualizadoPor(typeof contact.id === 'string' ? parseInt(contact.id) || 0 : contact.id)
    }))
  }, [contacts])

  // Helper para mapear status
  function mapStatusToLegacy(status: string): Contact['status'] {
    switch (status) {
      case 'ACTIVE': return 'ativo'
      case 'INACTIVE': return 'inativo'
      case 'BLOCKED': return 'aguardando'
      default: return 'ativo'
    }
  }

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

  return { filteredLeads, isLoading: isLoading || contactsLoading, stats }
}
