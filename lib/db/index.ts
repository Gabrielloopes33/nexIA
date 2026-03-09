/**
 * Database Module Exports
 * 
 * Centraliza todas as exportações de funções de banco de dados
 * para facilitar importações no projeto.
 * 
 * @example
 * ```typescript
 * import { createInstance, getDashboardData } from '@/lib/db';
 * ```
 */

// Exporta funções CRUD do WhatsApp (novo schema flat)
export {
  // Instances
  createInstance,
  getInstanceById,
  getInstancesByOrganization,
  updateInstance,
  markInstanceAsConnected,
  deleteInstance,
  
  // Templates
  createTemplate,
  getTemplateById,
  getTemplateByTemplateId,
  getTemplatesByInstance,
  getApprovedTemplates,
  updateTemplate,
  submitTemplate,
  approveTemplate,
  rejectTemplate,
  deleteTemplate,
  
  // Contacts
  createContact,
  getContactById,
  getContactByPhone,
  getContactsByOrganization,
  updateContact,
  updateContactLeadScore,
  deleteContact,
  
  // Conversations
  createConversation,
  getConversationById,
  getActiveConversation,
  getConversationsByOrganization,
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
  
  // Logs
  createLog,
  getUnprocessedLogs,
  getLogsByInstance,
  markLogAsProcessed,
  cleanupOldLogs,
  
  // Utilities
  expireOldConversations,
  cleanupOldMessages,
  getConversationsWithRecentMessages,
  getOrganizationStats,
  getTopContacts,
  prisma,
  
  // Types
  type CreateInstanceInput,
  type UpdateInstanceInput,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type CreateContactInput,
  type UpdateContactInput,
  type CreateConversationInput,
  type UpdateConversationInput,
  type CreateMessageInput,
  type UpdateMessageInput,
  type CreateLogInput,
} from './whatsapp';

// Exporta queries complexas (mantidas se necessário, mas podem precisar de atualização)
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
