/**
 * WhatsApp Business API Functions
 * API integration functions for Meta WhatsApp Business API (Mock implementation)
 */

import type {
  WhatsAppBusinessAccount,
  WhatsAppPhoneNumber,
  WhatsAppTemplate,
  WebhookConfiguration,
  WebhookLog,
  WhatsAppAnalytics,
  ComplianceInfo,
  ConnectAccountRequest,
  ConnectAccountResponse,
  CreateTemplateRequest,
  UpdateWebhookRequest,
  AddPhoneNumberRequest,
  PhoneNumberQualityRating,
  TemplateStatus,
} from './types'

// ============================================
// Mock Data
// ============================================

const MOCK_WABA: WhatsAppBusinessAccount = {
  id: 'waba_123456',
  name: 'NexIA Business',
  accountId: 'acc_789012',
  status: 'connected',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-12-01T15:30:00Z',
  wabaId: '123456789012345',
  phoneNumbers: [],
  messageTemplates: [],
}

const MOCK_PHONE_NUMBERS: WhatsAppPhoneNumber[] = [
  {
    id: 'phone_001',
    displayPhoneNumber: '+55 11 98765-4321',
    verifiedName: 'NexIA Suporte',
    qualityRating: 'GREEN',
    status: 'VERIFIED',
    isDefault: true,
    isPinEnabled: true,
    accountMode: 'LIVE',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'phone_002',
    displayPhoneNumber: '+55 11 91234-5678',
    verifiedName: 'NexIA Vendas',
    qualityRating: 'YELLOW',
    status: 'VERIFIED',
    isDefault: false,
    isPinEnabled: true,
    accountMode: 'LIVE',
    createdAt: '2024-02-20T14:30:00Z',
  },
]

const MOCK_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'template_001',
    name: 'boas_vindas',
    category: 'UTILITY',
    status: 'APPROVED',
    language: 'pt_BR',
    components: [
      {
        type: 'BODY',
        text: 'Olá {{1}}, seja bem-vindo à NexIA! 🎉\n\nEstamos aqui para ajudar você. Como podemos ajudar hoje?',
      },
      {
        type: 'FOOTER',
        text: 'NexIA - Inteligência Artificial',
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Suporte' },
          { type: 'QUICK_REPLY', text: 'Vendas' },
        ],
      },
    ],
    allowCategoryChange: false,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'template_002',
    name: 'codigo_verificacao',
    category: 'AUTHENTICATION',
    status: 'APPROVED',
    language: 'pt_BR',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Seu código de verificação',
      },
      {
        type: 'BODY',
        text: 'Use o código abaixo para verificar sua conta:\n\n*{{1}}*\n\nEste código expira em 10 minutos.',
      },
    ],
    allowCategoryChange: false,
    createdAt: '2024-02-10T15:00:00Z',
    updatedAt: '2024-02-10T15:00:00Z',
  },
  {
    id: 'template_003',
    name: 'promocao_natal',
    category: 'MARKETING',
    status: 'PENDING',
    language: 'pt_BR',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🎄 Promoção de Natal!',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}}! Temos uma oferta especial de Natal para você.\n\nAproveite 30% OFF em todos os planos!',
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Aproveitar Agora', url: 'https://nexia.chat/promo' },
        ],
      },
    ],
    allowCategoryChange: true,
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
  },
]

const MOCK_WEBHOOK_CONFIG: WebhookConfiguration = {
  id: 'webhook_001',
  url: 'https://api.nexia.chat/webhooks/whatsapp',
  verifyToken: 'verify_token_abc123',
  events: ['messages', 'message_template_status_update', 'phone_number_quality_update'],
  active: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-11-20T16:45:00Z',
}

const MOCK_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'log_001',
    timestamp: '2024-12-01T10:30:00Z',
    event: 'messages',
    payload: { message: { from: '5511987654321', text: { body: 'Olá' } } },
    status: 'success',
    retryCount: 0,
  },
  {
    id: 'log_002',
    timestamp: '2024-12-01T10:35:00Z',
    event: 'message_template_status_update',
    payload: { template_id: 'template_003', status: 'PENDING' },
    status: 'success',
    retryCount: 0,
  },
  {
    id: 'log_003',
    timestamp: '2024-12-01T11:00:00Z',
    event: 'messages',
    payload: { message: { from: '5511912345678', text: { body: 'Quero saber mais' } } },
    status: 'error',
    errorMessage: 'Timeout',
    retryCount: 2,
  },
]

const MOCK_COMPLIANCE: ComplianceInfo = {
  businessVerificationStatus: 'VERIFIED',
  messagingLimit: 'TIER_1K',
  qualityScore: 8.5,
  lastQualityUpdate: '2024-12-01T00:00:00Z',
  violations: [],
}

// ============================================
// Account Management
// ============================================

export async function connectWhatsAppAccount(
  request: ConnectAccountRequest
): Promise<ConnectAccountResponse> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock success response
  return {
    success: true,
    account: {
      ...MOCK_WABA,
      phoneNumbers: MOCK_PHONE_NUMBERS,
      messageTemplates: MOCK_TEMPLATES,
    },
  }
}

export async function disconnectWhatsAppAccount(accountId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return true
}

export async function refreshAccountConnection(accountId: string): Promise<WhatsAppBusinessAccount> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    ...MOCK_WABA,
    phoneNumbers: MOCK_PHONE_NUMBERS,
    messageTemplates: MOCK_TEMPLATES,
  }
}

export async function getAccountStatus(accountId: string): Promise<WhatsAppBusinessAccount['status']> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return 'connected'
}

// ============================================
// Phone Numbers
// ============================================

export async function getPhoneNumbers(wabaId: string): Promise<WhatsAppPhoneNumber[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return MOCK_PHONE_NUMBERS
}

export async function addPhoneNumber(
  wabaId: string,
  request: AddPhoneNumberRequest
): Promise<WhatsAppPhoneNumber> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    id: `phone_${Date.now()}`,
    displayPhoneNumber: request.phoneNumber,
    verifiedName: 'Pending Verification',
    qualityRating: 'UNKNOWN',
    status: 'PENDING',
    isDefault: false,
    isPinEnabled: false,
    accountMode: 'SANDBOX',
    createdAt: new Date().toISOString(),
  }
}

export async function removePhoneNumber(phoneNumberId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return true
}

export async function requestVerificationCode(phoneNumberId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return true
}

export async function verifyPhoneNumber(
  phoneNumberId: string,
  code: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return true
}

export async function setDefaultPhoneNumber(
  wabaId: string,
  phoneNumberId: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return true
}

// ============================================
// Message Templates
// ============================================

export async function getTemplates(wabaId: string): Promise<WhatsAppTemplate[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return MOCK_TEMPLATES
}

export async function createTemplate(
  wabaId: string,
  request: CreateTemplateRequest
): Promise<WhatsAppTemplate> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return {
    id: `template_${Date.now()}`,
    ...request,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return true
}

export async function getTemplateAnalytics(
  templateId: string,
  period: { start: string; end: string }
): Promise<{ sent: number; delivered: number; read: number }> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return {
    sent: Math.floor(Math.random() * 1000) + 100,
    delivered: Math.floor(Math.random() * 900) + 50,
    read: Math.floor(Math.random() * 700) + 20,
  }
}

// ============================================
// Webhooks
// ============================================

export async function getWebhookConfig(wabaId: string): Promise<WebhookConfiguration | null> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return MOCK_WEBHOOK_CONFIG
}

export async function updateWebhookConfig(
  wabaId: string,
  config: UpdateWebhookRequest
): Promise<WebhookConfiguration> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  return {
    ...MOCK_WEBHOOK_CONFIG,
    ...config,
    updatedAt: new Date().toISOString(),
  }
}

export async function testWebhook(url: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return {
    success: true,
    message: 'Webhook testado com sucesso!',
  }
}

export async function getWebhookLogs(
  webhookId: string,
  limit: number = 50
): Promise<WebhookLog[]> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return MOCK_WEBHOOK_LOGS.slice(0, limit)
}

// ============================================
// Analytics
// ============================================

export async function getAnalytics(
  wabaId: string,
  period: { start: string; end: string }
): Promise<WhatsAppAnalytics> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    period,
    messages: {
      total: 15420,
      sent: 15420,
      delivered: 14850,
      read: 12340,
      failed: 180,
    },
    conversations: {
      total: 3250,
      byCategory: {
        MARKETING: 850,
        UTILITY: 1200,
        AUTHENTICATION: 600,
        SERVICE: 600,
        UNKNOWN: 0,
      },
      totalCost: 45.5,
      currency: 'USD',
    },
    templates: {
      totalSent: 8750,
      byTemplate: {
        boas_vindas: 3200,
        codigo_verificacao: 1800,
        promocao_natal: 1500,
      },
    },
  }
}

export async function getComplianceInfo(wabaId: string): Promise<ComplianceInfo> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return MOCK_COMPLIANCE
}

// ============================================
// Utility Functions
// ============================================

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    return `+55 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }
  return phone
}

export function getQualityRatingColor(rating: PhoneNumberQualityRating): string {
  const colors: Record<PhoneNumberQualityRating, string> = {
    GREEN: '#22c55e',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
    UNKNOWN: '#6b7280',
  }
  return colors[rating] || colors.UNKNOWN
}

export function getTemplateStatusColor(status: TemplateStatus): string {
  const colors: Record<TemplateStatus, string> = {
    APPROVED: '#22c55e',
    PENDING: '#f59e0b',
    REJECTED: '#ef4444',
    PAUSED: '#6b7280',
    FLAGGED: '#f97316',
    DISABLED: '#dc2626',
  }
  return colors[status] || '#6b7280'
}
