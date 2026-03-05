/**
 * WhatsApp Business API Constants
 * Constants for Meta WhatsApp Business API integration
 */

import type { 
  QualityRatingConfig, 
  TemplateStatusConfig, 
  TemplateCategory,
  WebhookEventType 
} from './types'
import { CheckCircle, Clock, XCircle, PauseCircle, AlertCircle, Ban } from 'lucide-react'

// ============================================
// Brand Colors
// ============================================

export const WHATSAPP_COLORS = {
  primary: '#25D366',
  primaryDark: '#128C7E',
  primaryLight: '#DCF8C6',
  secondary: '#34B7F1',
  background: '#ECE5DD',
  chatBackground: '#DCF8C6',
  text: '#075E54',
  textSecondary: '#4A4A4A',
  error: '#FF6B6B',
  warning: '#FFA500',
  success: '#25D366',
} as const

// ============================================
// Quality Rating Configurations
// ============================================

export const QUALITY_RATING_CONFIG: Record<string, QualityRatingConfig> = {
  GREEN: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Alta Qualidade',
    description: 'Seu número está com excelente qualidade de entrega',
  },
  YELLOW: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Qualidade Média',
    description: 'Atenção: seu número pode estar sendo reportado',
  },
  RED: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Baixa Qualidade',
    description: 'Crítico: seu número pode ser bloqueado. Aja imediatamente!',
  },
  UNKNOWN: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Desconhecida',
    description: 'Qualidade não disponível para este número',
  },
} as const

// ============================================
// Template Status Configurations
// ============================================

export const TEMPLATE_STATUS_CONFIG: Record<string, TemplateStatusConfig> = {
  APPROVED: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Aprovado',
    icon: CheckCircle,
  },
  PENDING: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Pendente',
    icon: Clock,
  },
  REJECTED: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rejeitado',
    icon: XCircle,
  },
  PAUSED: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Pausado',
    icon: PauseCircle,
  },
  FLAGGED: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Sinalizado',
    icon: AlertCircle,
  },
  DISABLED: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Desativado',
    icon: Ban,
  },
} as const

// ============================================
// Template Categories
// ============================================

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  {
    value: 'UTILITY',
    label: 'Utilidade',
    description: 'Mensagens transacionais como confirmações, atualizações e alertas',
  },
  {
    value: 'MARKETING',
    label: 'Marketing',
    description: 'Mensagens promocionais, anúncios e campanhas',
  },
  {
    value: 'AUTHENTICATION',
    label: 'Autenticação',
    description: 'Códigos OTP, verificações de login e autenticação de dois fatores',
  },
] as const

// ============================================
// Webhook Event Types
// ============================================

export const WEBHOOK_EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  {
    value: 'messages',
    label: 'Mensagens',
    description: 'Receber mensagens de clientes e atualizações de status',
  },
  {
    value: 'message_template_status_update',
    label: 'Status de Templates',
    description: 'Notificações quando templates são aprovados, rejeitados ou alterados',
  },
  {
    value: 'phone_number_quality_update',
    label: 'Qualidade do Número',
    description: 'Atualizações de qualidade (Green/Yellow/Red) do número de telefone',
  },
  {
    value: 'phone_number_name_update',
    label: 'Nome do Número',
    description: 'Atualizações quando o nome verificado do número muda',
  },
  {
    value: 'account_alerts',
    label: 'Alertas da Conta',
    description: 'Alertas importantes sobre a conta WhatsApp Business',
  },
  {
    value: 'account_review_update',
    label: 'Revisão da Conta',
    description: 'Atualizações sobre revisões e violações de política',
  },
  {
    value: 'business_capability_update',
    label: 'Capacidades de Negócio',
    description: 'Mudanças nas capacidades disponíveis para o negócio',
  },
  {
    value: 'template_category_update',
    label: 'Categoria de Template',
    description: 'Atualizações quando a categoria de um template é alterada pela Meta',
  },
] as const

// ============================================
// Phone Number Status
// ============================================

export const PHONE_NUMBER_STATUS = {
  VERIFIED: {
    label: 'Verificado',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  PENDING: {
    label: 'Pendente',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  UNVERIFIED: {
    label: 'Não Verificado',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  SUSPENDED: {
    label: 'Suspenso',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  DELETED: {
    label: 'Excluído',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
} as const

// ============================================
// Connection Status
// ============================================

export const CONNECTION_STATUS_CONFIG = {
  not_connected: {
    label: 'Não Conectado',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Conecte sua conta WhatsApp Business para começar',
  },
  connecting: {
    label: 'Conectando',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Estabelecendo conexão com a Meta...',
  },
  connected: {
    label: 'Conectado',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Conexão ativa e funcionando normalmente',
  },
  disconnected: {
    label: 'Desconectado',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Conexão perdida. Tente reconectar.',
  },
  error: {
    label: 'Erro',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Erro na conexão. Verifique as configurações.',
  },
  token_expired: {
    label: 'Token Expirado',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Token de acesso expirado. Reautentique.',
  },
} as const

// ============================================
// API Endpoints (Mock)
// ============================================

export const WHATSAPP_API_ENDPOINTS = {
  baseUrl: 'https://graph.facebook.com/v18.0',
  auth: {
    exchangeToken: '/oauth/access_token',
    debugToken: '/debug_token',
  },
  businessAccounts: {
    list: '/me/businesses',
    get: (id: string) => `/${id}`,
    phoneNumbers: (id: string) => `/${id}/phone_numbers`,
    messageTemplates: (id: string) => `/${id}/message_templates`,
  },
  phoneNumbers: {
    get: (id: string) => `/${id}`,
    verify: (id: string) => `/${id}/verify`,
    requestCode: (id: string) => `/${id}/request_code`,
    verifyCode: (id: string) => `/${id}/verify_code`,
  },
  messageTemplates: {
    create: (wabaId: string) => `/${wabaId}/message_templates`,
    update: (templateId: string) => `/${templateId}`,
    delete: (templateId: string) => `/${templateId}`,
  },
} as const

// ============================================
// Limits and Constraints
// ============================================

export const WHATSAPP_LIMITS = {
  templateNameMaxLength: 512,
  templateBodyMaxLength: 1024,
  templateHeaderMaxLength: 60,
  templateFooterMaxLength: 60,
  maxButtons: 10,
  maxQuickReplies: 3,
  phoneNumberDisplayMax: 20,
  webhookUrlMaxLength: 2048,
  verifyTokenMaxLength: 256,
} as const

// ============================================
// Messaging Limits
// ============================================

export const MESSAGING_LIMITS = {
  TIER_NOT_SET: { label: 'Não Definido', limit: 0 },
  TIER_50: { label: 'Tier 1', limit: 50 },
  TIER_250: { label: 'Tier 2', limit: 250 },
  TIER_1K: { label: 'Tier 3', limit: 1000 },
  TIER_10K: { label: 'Tier 4', limit: 10000 },
  TIER_100K: { label: 'Tier 5', limit: 100000 },
  TIER_UNLIMITED: { label: 'Ilimitado', limit: Infinity },
} as const

// ============================================
// Time Constants
// ============================================

export const WHATSAPP_TIME_CONSTANTS = {
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  webhookTimeout: 30000, // 30 seconds
  maxRetryAttempts: 3,
  retryDelay: 1000, // 1 second
  analyticsCacheDuration: 5 * 60 * 1000, // 5 minutes
} as const
