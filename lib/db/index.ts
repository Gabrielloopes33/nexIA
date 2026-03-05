/**
 * Database Module Exports
 * 
 * Centraliza todas as exportações de funções de banco de dados
 * para facilitar importações no projeto.
 * 
 * @example
 * ```typescript
 * import { createWABA, getDashboardData } from '@/lib/db';
 * ```
 */

// Exporta funções CRUD do WhatsApp
export {
  // WABA
  createWABA,
  getWABAById,
  getWABAByWabaId,
  getWABAsByUser,
  updateWABA,
  markWABAAsConnected,
  deleteWABA,
  
  // Phone Numbers
  createPhoneNumber,
  getPhoneNumberById,
  getPhoneNumberByPhoneNumberId,
  getPhoneNumbersByWABA,
  getDefaultPhoneNumber,
  updatePhoneNumber,
  setDefaultPhoneNumber,
  deletePhoneNumber,
  
  // Templates
  createTemplate,
  getTemplateById,
  getTemplateByTemplateId,
  getTemplatesByWABA,
  getApprovedTemplates,
  updateTemplate,
  submitTemplate,
  approveTemplate,
  rejectTemplate,
  deleteTemplate,
  
  // Conversations
  createConversation,
  getConversationById,
  getActiveConversation,
  getConversationsByWABA,
  getActiveConversations,
  updateConversation,
  extendConversationWindow,
  closeConversation,
  deleteConversation,
  
  // Messages
  createMessage,
  getMessageById,
  getMessageByMessageId,
  getMessagesByConversation,
  updateMessageStatus,
  updateMessage,
  deleteMessage,
  
  // Webhook Events
  createWebhookEvent,
  getUnprocessedWebhookEvents,
  getWebhookEventsByWABA,
  markWebhookEventAsProcessed,
  cleanupOldWebhookEvents,
  
  // Analytics
  upsertAnalytics,
  getAnalyticsByWABA,
  getAggregatedAnalytics,
  incrementAnalytics,
  
  // Utilities
  expireOldConversations,
  cleanupOldMessages,
  getConversationsWithRecentMessages,
  prisma,
  
  // Types
  type CreateWABAInput,
  type UpdateWABAInput,
  type CreatePhoneNumberInput,
  type UpdatePhoneNumberInput,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type CreateConversationInput,
  type UpdateConversationInput,
  type CreateMessageInput,
  type UpdateMessageInput,
  type CreateWebhookEventInput,
  type CreateAnalyticsInput,
} from './whatsapp';

// Exporta queries complexas
export {
  // Conversation metrics
  getConversationMetrics,
  getConversationsByDay,
  getExpiringConversations,
  
  // Message metrics
  getMessageMetrics,
  getDeliveryRates,
  getMessagesByHour,
  getRecentMessages,
  
  // Contact stats
  getContactStats,
  searchContacts,
  
  // Template stats
  getTemplateStats,
  getTopTemplates,
  
  // Quality metrics
  getQualityMetrics,
  getQualityHistory,
  
  // Dashboard
  getDashboardData,
  getUserOverview,
  
  // Maintenance
  getWebhookStats,
  getTableStats,
  
  // Export
  exportConversations,
  exportMessages,
  
  // Types
  type ConversationMetrics,
  type MessageMetrics,
  type DailyStats,
  type ContactStats,
  type TemplateStats,
  type QualityMetrics,
  type HourlyActivity,
} from './queries';
