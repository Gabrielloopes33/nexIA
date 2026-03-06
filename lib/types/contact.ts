/**
 * Contact Management Types
 * Definições de tipos para o sistema de gerenciamento de contatos
 * Agora com suporte a Tags, UTM tracking e AI scoring
 */

import type { UTMTouchpoint } from './tag'

export type ContactStatus = "ativo" | "inativo" | "aguardando"
export type ContactSource = "LinkedIn" | "Manual" | "Import" | "API"

export interface Contact {
  /** ID único do contato */
  id: number
  /** Nome completo do contato */
  nome: string
  /** Email principal */
  email: string
  /** Telefone de contato (opcional) */
  telefone?: string
  /** Nome da empresa */
  empresa: string
  /** Cargo/posição na empresa */
  cargo?: string
  /** Localização (cidade, estado) */
  localizacao?: string
  /** Origem do contato */
  fonte: ContactSource
  /** Status atual do contato */
  status: ContactStatus
  /** Data do último contato (ISO string) */
  ultimoContato?: string
  /** Iniciais para avatar */
  avatar: string
  /** Tags manuais associadas ao contato (IDs) */
  tags?: string[]
  /** Tags sugeridas por IA (não confirmadas) */
  autoTags?: string[]
  /** Data de criação (ISO string) */
  criadoEm: string
  /** Data da última atualização (ISO string) */
  atualizadoEm: string
  /** Indica se está marcado como favorito */
  favorito?: boolean
  /** Número de negócios associados */
  negocios?: number
  /** Valor total em receita */
  receita?: number
  
  // --- UTM Attribution Tracking ---
  /** Primeiro touchpoint (first-touch attribution) */
  firstTouch?: UTMTouchpoint
  /** Último touchpoint (last-touch attribution) */
  lastTouch?: UTMTouchpoint
  /** Histórico completo de touchpoints para multi-touch attribution */
  touchpoints?: UTMTouchpoint[]
  

  
  // --- Profile Data (para scoring) ---
  /** Tamanho da empresa (número de funcionários) */
  companySize?: number
  /** Cargo/título na empresa */
  jobTitle?: string
  /** Indústria da empresa */
  industry?: string
}

export interface ContactFilters {
  search: string
  status: ContactStatus | "todos"
  fonte: ContactSource | "todos"
}
