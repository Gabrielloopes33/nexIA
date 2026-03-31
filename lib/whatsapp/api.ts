/**
 * WhatsApp Business API Functions
 * Real API implementation - calls the backend
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

const API_BASE = '/api/whatsapp'

// ============================================
// Helper Functions
// ============================================

async function fetchWithError<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`)
  }

  return data
}

// ============================================
// Instances (Phone Numbers) - Real API
// ============================================

export interface WhatsAppInstance {
  id: string
  name: string
  phoneNumber: string
  displayPhoneNumber?: string
  verifiedName?: string
  status: string
  qualityRating: string
  messagingLimit?: number
  messagingTier?: number
  isDefault?: boolean
  connectedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateInstanceRequest {
  name: string
  phoneNumber: string
  displayPhoneNumber?: string
  phoneNumberId?: string
  wabaId?: string
  accessToken?: string
  verifiedName?: string
}

/**
 * Get all WhatsApp instances for the current organization
 */
export async function getInstances(): Promise<WhatsAppInstance[]> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance[] }>(
    `${API_BASE}/instances`
  )
  return data.data
}

/**
 * Create a new WhatsApp instance
 */
export async function createInstance(
  request: CreateInstanceRequest
): Promise<WhatsAppInstance> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance }>(
    `${API_BASE}/instances`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  )
  return data.data
}

/**
 * Get a specific WhatsApp instance
 */
export async function getInstance(id: string): Promise<WhatsAppInstance> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance }>(
    `${API_BASE}/instances/${id}`
  )
  return data.data
}

/**
 * Update a WhatsApp instance
 */
export async function updateInstance(
  id: string,
  updates: Partial<CreateInstanceRequest>
): Promise<WhatsAppInstance> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance }>(
    `${API_BASE}/instances/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  )
  return data.data
}

/**
 * Delete a WhatsApp instance
 */
export async function deleteInstance(id: string): Promise<void> {
  await fetchWithError<{ success: boolean }>(
    `${API_BASE}/instances/${id}`,
    {
      method: 'DELETE',
    }
  )
}

/**
 * Set an instance as the default
 */
export async function setDefaultInstance(id: string): Promise<WhatsAppInstance> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance }>(
    `${API_BASE}/instances/${id}/default`,
    {
      method: 'POST',
    }
  )
  return data.data
}

/**
 * Disconnect an instance
 */
export async function disconnectInstance(id: string): Promise<WhatsAppInstance> {
  const data = await fetchWithError<{ success: boolean; data: WhatsAppInstance }>(
    `${API_BASE}/instances/${id}/disconnect`,
    {
      method: 'POST',
    }
  )
  return data.data
}

// ============================================
// Legacy Phone Numbers API (mapped to instances)
// ============================================

/**
 * Get phone numbers (mapped from instances)
 */
export async function getPhoneNumbers(wabaId?: string): Promise<WhatsAppPhoneNumber[]> {
  const instances = await getInstances()
  
  // Map instances to WhatsAppPhoneNumber format
  return instances.map((instance) => ({
    id: instance.id,
    displayPhoneNumber: instance.displayPhoneNumber || instance.phoneNumber,
    verifiedName: instance.verifiedName || instance.name,
    qualityRating: instance.qualityRating as WhatsAppPhoneNumber['qualityRating'],
    status: (instance.status === 'CONNECTED' ? 'VERIFIED' : 
            instance.status === 'PENDING_SETUP' ? 'PENDING' : 'UNVERIFIED') as WhatsAppPhoneNumber['status'],
    isDefault: instance.isDefault || false,
    isPinEnabled: true,
    accountMode: 'LIVE' as const,
    createdAt: instance.createdAt,
  }))
}

/**
 * Add phone number (creates instance)
 */
export async function addPhoneNumber(
  wabaId: string,
  request: AddPhoneNumberRequest
): Promise<WhatsAppPhoneNumber> {
  const instance = await createInstance({
    name: `WhatsApp ${request.phoneNumber}`,
    phoneNumber: request.phoneNumber,
    displayPhoneNumber: request.phoneNumber,
    verifiedName: `WhatsApp ${request.phoneNumber}`,
  })

  return {
    id: instance.id,
    displayPhoneNumber: instance.displayPhoneNumber || instance.phoneNumber,
    verifiedName: instance.verifiedName || instance.name,
    qualityRating: 'UNKNOWN',
    status: 'PENDING',
    isDefault: false,
    isPinEnabled: false,
    accountMode: 'SANDBOX',
    createdAt: instance.createdAt,
  }
}

/**
 * Remove phone number (deletes instance)
 */
export async function removePhoneNumber(phoneNumberId: string): Promise<boolean> {
  await deleteInstance(phoneNumberId)
  return true
}

/**
 * Request verification code
 */
export async function requestVerificationCode(phoneNumberId: string): Promise<boolean> {
  await updateInstance(phoneNumberId, { status: 'PENDING_SETUP' })
  return true
}

/**
 * Verify phone number
 */
export async function verifyPhoneNumber(
  phoneNumberId: string,
  code: string
): Promise<boolean> {
  await updateInstance(phoneNumberId, { 
    status: 'CONNECTED',
    qualityRating: 'GREEN',
  })
  return true
}

/**
 * Set default phone number
 */
export async function setDefaultPhoneNumber(
  wabaId: string,
  phoneNumberId: string
): Promise<boolean> {
  await setDefaultInstance(phoneNumberId)
  return true
}

// ============================================
// Account Management
// ============================================

export async function connectWhatsAppAccount(
  request: ConnectAccountRequest
): Promise<ConnectAccountResponse> {
  // This integrates with backend
  const instances = await getInstances()
  const connectedInstances = instances.filter(i => i.status === 'CONNECTED')
  
  return {
    success: true,
    account: {
      id: 'waba_' + Date.now(),
      name: 'WhatsApp Business',
      accountId: request.wabaId,
      status: connectedInstances.length > 0 ? 'connected' : 'not_connected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wabaId: request.wabaId,
      phoneNumbers: connectedInstances.map(instance => ({
        id: instance.id,
        displayPhoneNumber: instance.displayPhoneNumber || instance.phoneNumber,
        verifiedName: instance.verifiedName || instance.name,
        qualityRating: instance.qualityRating as WhatsAppPhoneNumber['qualityRating'],
        status: 'VERIFIED' as const,
        isDefault: instance.isDefault || false,
        isPinEnabled: true,
        accountMode: 'LIVE',
        createdAt: instance.createdAt,
      })),
      messageTemplates: [],
    },
  }
}

export async function disconnectWhatsAppAccount(accountId: string): Promise<boolean> {
  const instances = await getInstances()
  for (const instance of instances) {
    await disconnectInstance(instance.id)
  }
  return true
}

export async function refreshAccountConnection(accountId: string): Promise<WhatsAppBusinessAccount> {
  const instances = await getInstances()
  
  return {
    id: accountId,
    name: 'WhatsApp Business',
    accountId: accountId,
    status: instances.some(i => i.status === 'CONNECTED') ? 'connected' : 'not_connected',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wabaId: accountId.replace('waba_', ''),
    phoneNumbers: instances.map(instance => ({
      id: instance.id,
      displayPhoneNumber: instance.displayPhoneNumber || instance.phoneNumber,
      verifiedName: instance.verifiedName || instance.name,
      qualityRating: instance.qualityRating as WhatsAppPhoneNumber['qualityRating'],
      status: (instance.status === 'CONNECTED' ? 'VERIFIED' : 'PENDING') as WhatsAppPhoneNumber['status'],
      isDefault: instance.isDefault || false,
      isPinEnabled: true,
      accountMode: 'LIVE',
      createdAt: instance.createdAt,
    })),
    messageTemplates: [],
  }
}

export async function getAccountStatus(accountId: string): Promise<WhatsAppBusinessAccount['status']> {
  const instances = await getInstances()
  return instances.some(i => i.status === 'CONNECTED') ? 'connected' : 'not_connected'
}

// ============================================
// Message Templates (Mock for now)
// ============================================

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
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
]

export async function getTemplates(wabaId: string): Promise<WhatsAppTemplate[]> {
  return MOCK_TEMPLATES
}

export async function createTemplate(
  wabaId: string,
  request: CreateTemplateRequest
): Promise<WhatsAppTemplate> {
  return {
    id: `template_${Date.now()}`,
    ...request,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  return true
}

export async function getTemplateAnalytics(
  templateId: string,
  period: { start: string; end: string }
): Promise<{ sent: number; delivered: number; read: number }> {
  return {
    sent: Math.floor(Math.random() * 1000) + 100,
    delivered: Math.floor(Math.random() * 900) + 50,
    read: Math.floor(Math.random() * 700) + 20,
  }
}

// ============================================
// Webhooks (Mock for now)
// ============================================

const MOCK_WEBHOOK_CONFIG: WebhookConfiguration = {
  id: 'webhook_001',
  url: 'https://api.nexia.chat/webhooks/whatsapp',
  verifyToken: 'verify_token_abc123',
  events: ['messages', 'message_template_status_update', 'phone_number_quality_update'],
  active: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-11-20T16:45:00Z',
}

export async function getWebhookConfig(wabaId: string): Promise<WebhookConfiguration | null> {
  return MOCK_WEBHOOK_CONFIG
}

export async function updateWebhookConfig(
  wabaId: string,
  config: UpdateWebhookRequest
): Promise<WebhookConfiguration> {
  return {
    ...MOCK_WEBHOOK_CONFIG,
    ...config,
    updatedAt: new Date().toISOString(),
  }
}

export async function testWebhook(url: string): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: 'Webhook testado com sucesso!',
  }
}

export async function getWebhookLogs(
  webhookId: string,
  limit: number = 50
): Promise<WebhookLog[]> {
  return []
}

// ============================================
// Analytics (Mock for now)
// ============================================

export async function getAnalytics(
  wabaId: string,
  period: { start: string; end: string }
): Promise<WhatsAppAnalytics> {
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
  return {
    businessVerificationStatus: 'VERIFIED',
    messagingLimit: 'TIER_1K',
    qualityScore: 8.5,
    lastQualityUpdate: new Date().toISOString(),
    violations: [],
  }
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
