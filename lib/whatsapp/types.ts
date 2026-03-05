/**
 * WhatsApp Business API Types
 * Type definitions for Meta WhatsApp Business API integration
 */

// ============================================
// Enums and Constants
// ============================================

export type WhatsAppConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'token_expired'

export type PhoneNumberQualityRating =
  | 'GREEN'
  | 'YELLOW'
  | 'RED'
  | 'UNKNOWN'

export type PhoneNumberStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'UNVERIFIED'
  | 'SUSPENDED'
  | 'DELETED'

export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'FLAGGED'
  | 'DISABLED'

export type TemplateCategory =
  | 'UTILITY'
  | 'MARKETING'
  | 'AUTHENTICATION'

export type TemplateComponentType =
  | 'HEADER'
  | 'BODY'
  | 'FOOTER'
  | 'BUTTONS'

export type TemplateHeaderType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'

export type ButtonType =
  | 'QUICK_REPLY'
  | 'URL'
  | 'PHONE_NUMBER'
  | 'OTP'
  | 'MPM'
  | 'CATALOG'
  | 'FLOW'
  | 'VOICE_CALL'

export type WebhookEventType =
  | 'messages'
  | 'message_template_status_update'
  | 'phone_number_quality_update'
  | 'phone_number_name_update'
  | 'account_alerts'
  | 'account_review_update'
  | 'business_capability_update'
  | 'template_category_update'

export type MessageDirection = 'inbound' | 'outbound'

export type MessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending'

export type ConversationCategory =
  | 'MARKETING'
  | 'UTILITY'
  | 'AUTHENTICATION'
  | 'SERVICE'
  | 'UNKNOWN'

// ============================================
// Core Types
// ============================================

export interface WhatsAppBusinessAccount {
  id: string
  name: string
  accountId: string
  status: WhatsAppConnectionStatus
  createdAt: string
  updatedAt: string
  wabaId: string
  phoneNumbers: WhatsAppPhoneNumber[]
  messageTemplates: WhatsAppTemplate[]
  analytics?: WhatsAppAnalytics
}

export interface WhatsAppPhoneNumber {
  id: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: PhoneNumberQualityRating
  status: PhoneNumberStatus
  isDefault: boolean
  isPinEnabled: boolean
  accountMode: 'SANDBOX' | 'LIVE'
  certificate?: string
  createdAt: string
  conversationAnalytics?: PhoneNumberConversationAnalytics
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  status: TemplateStatus
  language: string
  components: TemplateComponent[]
  rejectedReason?: string
  allowCategoryChange: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateComponent {
  type: TemplateComponentType
  text?: string
  format?: TemplateHeaderType
  example?: TemplateExample
  buttons?: TemplateButton[]
}

export interface TemplateExample {
  header_handle?: string[]
  header_text?: string[]
  body_text?: string[][]
}

export interface TemplateButton {
  type: ButtonType
  text: string
  url?: string
  phone_number?: string
  example?: string[]
}

export interface WebhookConfiguration {
  id: string
  url: string
  verifyToken: string
  events: WebhookEventType[]
  active: boolean
  secret?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookLog {
  id: string
  timestamp: string
  event: WebhookEventType
  payload: Record<string, unknown>
  status: 'success' | 'error' | 'pending'
  errorMessage?: string
  retryCount: number
}

export interface PhoneNumberConversationAnalytics {
  phoneNumber: string
  period: {
    start: string
    end: string
  }
  conversations: {
    category: ConversationCategory
    count: number
    cost: number
    currency: string
  }[]
  totalConversations: number
  totalCost: number
}

export interface WhatsAppAnalytics {
  period: {
    start: string
    end: string
  }
  messages: {
    total: number
    sent: number
    delivered: number
    read: number
    failed: number
  }
  conversations: {
    total: number
    byCategory: Record<ConversationCategory, number>
    totalCost: number
    currency: string
  }
  templates: {
    totalSent: number
    byTemplate: Record<string, number>
  }
}

export interface ComplianceInfo {
  businessVerificationStatus: 'VERIFIED' | 'PENDING' | 'NOT_VERIFIED'
  messagingLimit: string
  qualityScore: number
  lastQualityUpdate: string
  violations: ComplianceViolation[]
}

export interface ComplianceViolation {
  id: string
  type: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface ConnectAccountRequest {
  accessToken: string
  wabaId: string
}

export interface ConnectAccountResponse {
  success: boolean
  account: WhatsAppBusinessAccount
  error?: string
}

export interface AddPhoneNumberRequest {
  phoneNumber: string
  countryCode: string
}

export interface CreateTemplateRequest {
  name: string
  category: TemplateCategory
  language: string
  components: TemplateComponent[]
  allowCategoryChange?: boolean
}

export interface UpdateWebhookRequest {
  url: string
  verifyToken: string
  events: WebhookEventType[]
  secret?: string
}

// ============================================
// UI Component Types
// ============================================

export interface WhatsAppStatsCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  description?: string
}

export interface QualityRatingConfig {
  color: string
  bgColor: string
  label: string
  description: string
}

export interface TemplateStatusConfig {
  color: string
  bgColor: string
  label: string
  icon: React.ElementType
}
