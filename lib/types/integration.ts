/**
 * Integration Type Definitions
 * Enterprise-grade CRM integrations system
 */

export type IntegrationCategory = 
  | 'communication'
  | 'infoproduct'
  | 'email'
  | 'analytics'
  | 'crm'
  | 'automation'
  | 'other';

export type ConnectionStatus = 
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error'
  | 'warning'
  | 'paused';

export type AuthMethod = 
  | 'oauth'
  | 'api_key'
  | 'webhook'
  | 'smtp';

export type ActivityEventType = 
  | 'sync_start'
  | 'sync_complete'
  | 'message_received'
  | 'message_sent'
  | 'webhook_received'
  | 'error'
  | 'warning'
  | 'connection_test'
  | 'status_change';

export type ActivityStatus = 'success' | 'warning' | 'error';

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  color: string; // Brand color
  category: IntegrationCategory;
  authMethod: AuthMethod;
  status: ConnectionStatus;
  features: string[];
  
  // Metrics
  messagesCount?: number;
  lastSyncAt?: Date;
  healthScore?: number; // 0-100
  
  // Configuration
  settings?: IntegrationSettings;
  
  // Metadata
  popular?: boolean;
  verified?: boolean;
  comingSoon?: boolean;
  
  // Timestamps
  connectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  integrationId: string;
  integrationName: string;
  timestamp: Date;
  event: ActivityEventType;
  status: ActivityStatus;
  details: string;
  metadata?: Record<string, any>;
}

export interface IntegrationSettings {
  // Common settings (all integrations)
  enabled: boolean;
  autoSync: boolean;
  syncFrequency: '5min' | '30min' | '1hour' | 'manual' | 'realtime';
  notifyOnError: boolean;
  
  // Channel-specific (WhatsApp, Instagram, Chat)
  autoReply?: {
    enabled: boolean;
    message: string;
    businessHoursOnly: boolean;
  };
  
  // Webhook-specific (Hotmart, Eduzz, etc.)
  webhookUrl?: string;
  secretKey?: string;
  eventMapping?: {
    purchase: string;
    refund: string;
    subscription: string;
  };
  
  // Email-specific
  smtpSettings?: {
    host: string;
    port: number;
    username: string;
    secure: boolean;
  };
  
  // OAuth-specific
  oauthCredentials?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  
  // Custom field mapping
  fieldMapping?: {
    [integrationField: string]: string; // CRM field name
  };
}

export interface WebhookConfig {
  url: string;
  secretKey: string;
  events: string[];
  signatureValidation: boolean;
}

export interface IntegrationKPIs {
  connectedCount: number;
  totalMessages: number;
  avgHealthScore: number;
  lastSync: Date | null;
}

export interface IntegrationFilters {
  search: string;
  category: IntegrationCategory | 'all';
  status: 'all' | 'connected' | 'not_connected' | 'error';
  sortBy: 'popular' | 'name' | 'recent';
}
