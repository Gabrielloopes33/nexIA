/**
 * React Hooks
 * 
 * Custom hooks para o projeto nexIA
 */

// Contacts Hooks (Sprint 1)
export { useContacts, type Contact } from './use-contacts'
export { useTags, type Tag } from './use-tags'
export { useLists, type List } from './use-lists'

// WhatsApp Hooks
export { useWhatsAppInstances, type WhatsAppInstance } from './use-whatsapp-instances'

// Evolution API Hooks (WhatsApp não oficial)
export {
  useEvolution,
  type UseEvolutionReturn,
} from './use-evolution'
export {
  useConnectedInstances,
  type UseConnectedInstancesReturn,
} from './use-connected-instances'
export { useWhatsAppTemplatesSync } from './use-whatsapp-templates-sync'
export { useWhatsAppTemplates } from './use-whatsapp-templates'
export { useWhatsApp } from './use-whatsapp'
export { useSendMessage, type SendMessageRequest, type MessageType } from './use-send-message'

// Conversations Hooks
export {
  useConversations,
  useConversation,
  type Conversation,
  type ConversationStatus,
  type ConversationType,
  type Message,
  type MessageDirection,
  type MessageType,
  type MessageStatus,
  type ConversationStats,
} from './use-conversations'

// Integrations Hooks (Sprint 4)
export { useIntegrations, type UseIntegrationsReturn } from './use-integrations'

// Billing Hooks (Sprint 5)
export { usePlans, type Plan, type BillingInterval, type PlanStatus } from './use-plans'
export {
  useSubscriptions,
  type Subscription,
  type SubscriptionStatus,
  type SubscriptionInterval,
  type CreateSubscriptionData,
} from './use-subscriptions'
export { useInvoices, type Invoice, type InvoiceStatus, type InvoiceLineItem } from './use-invoices'
export {
  useCharges,
  type Charge,
  type ChargeStatus,
  type ChargeSource,
  type CreateChargeData,
  type RefundChargeData,
} from './use-charges'
export {
  useCoupons,
  type ValidatedCoupon,
  type CouponDiscountType,
  type ValidateCouponOptions,
} from './use-coupons'

// Dashboard Hooks (Sprint 6)
export {
  useDashboard,
  type DashboardPeriod,
  type DashboardMetrics,
  type DashboardCharts,
  type ChartDataPoint,
  type DashboardInsight,
  type UseDashboardReturn,
} from './use-dashboard'
