/**
 * WhatsApp Cloud API Client
 * Official Meta WhatsApp Business API Integration
 * API Version: v18.0
 */

const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// ============================================================================
// TYPES
// ============================================================================

export interface WhatsAppConfig {
  accessToken: string;
  wabaId: string;
  phoneNumberId?: string;
}

export interface WhatsAppError {
  code: number;
  message: string;
  type: string;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface WhatsAppApiResponse<T> {
  data?: T;
  error?: WhatsAppError;
}

export interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  code_verification_status: string;
  quality_rating: string;
  is_default: boolean;
}

export interface Template {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_handle?: string[];
    body_text?: string[][];
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY';
  text: string;
  phone_number?: string;
  url?: string;
}

export interface MessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface AnalyticsMetrics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class WhatsAppApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public type: string,
    public subcode?: number,
    public fbtraceId?: string
  ) {
    super(message);
    this.name = 'WhatsAppApiError';
  }
}

function handleApiError(error: WhatsAppError): never {
  throw new WhatsAppApiError(
    error.code,
    error.message,
    error.type,
    error.error_subcode,
    error.fbtrace_id
  );
}

// ============================================================================
// BASE HTTP CLIENT
// ============================================================================

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json() as WhatsAppApiResponse<T>;

  if (!response.ok || data.error) {
    if (data.error) {
      handleApiError(data.error);
    }
    throw new WhatsAppApiError(
      response.status,
      'Unknown error occurred',
      'UnknownError'
    );
  }

  return data.data as T;
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Validate access token and get token info
 */
export async function validateAccessToken(accessToken: string): Promise<{
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number;
  expires_at: number;
  is_valid: boolean;
  scopes: string[];
  user_id: string;
}> {
  const response = await fetch(
    `${BASE_URL}/debug_token?input_token=${accessToken}&access_token=${accessToken}`
  );
  
  const data = await response.json() as {
    data: {
      app_id: string;
      type: string;
      application: string;
      data_access_expires_at: number;
      expires_at: number;
      is_valid: boolean;
      scopes: string[];
      user_id: string;
      error?: WhatsAppError;
    };
    error?: WhatsAppError;
  };

  if (!response.ok || data.error || data.data.error) {
    throw new WhatsAppApiError(
      data.data.error?.code || data.error?.code || 400,
      data.data.error?.message || data.error?.message || 'Invalid token',
      data.data.error?.type || data.error?.type || 'OAuthException'
    );
  }

  return data.data;
}

/**
 * Exchange short-lived token for long-lived token
 */
export async function exchangeLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number; token_type: string }> {
  const endpoint = `/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  
  return makeRequest(endpoint, { method: 'GET' });
}

/**
 * Refresh long-lived token
 */
export async function refreshAccessToken(
  longLivedToken: string
): Promise<{ access_token: string; expires_in: number; token_type: string }> {
  const endpoint = `/oauth/access_token?grant_type=fb_exchange_token&fb_exchange_token=${longLivedToken}`;
  
  return makeRequest(endpoint, { method: 'GET' }, longLivedToken);
}

/**
 * Get WABA (WhatsApp Business Account) details
 */
export async function getWABADetails(
  wabaId: string,
  accessToken: string
): Promise<{
  id: string;
  name: string;
  timezone_id: string;
  message_template_namespace: string;
}> {
  return makeRequest(`/${wabaId}?fields=id,name,timezone_id,message_template_namespace`,
    { method: 'GET' },
    accessToken
  );
}

// ============================================================================
// PHONE NUMBERS FUNCTIONS
// ============================================================================

/**
 * List all phone numbers for a WABA
 */
export async function listPhoneNumbers(
  wabaId: string,
  accessToken: string
): Promise<{ data: PhoneNumber[]; paging?: { cursors: { before: string; after: string } } }> {
  return makeRequest(
    `/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status,quality_rating`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Get specific phone number details
 */
export async function getPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<PhoneNumber> {
  return makeRequest(
    `/${phoneNumberId}?fields=id,display_phone_number,verified_name,code_verification_status,quality_rating`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Register a new phone number
 */
export async function registerPhoneNumber(
  wabaId: string,
  phoneNumber: string,
  accessToken: string,
  pin?: string
): Promise<{ success: boolean; id?: string }> {
  return makeRequest(
    `/${wabaId}/phone_numbers`,
    {
      method: 'POST',
      body: JSON.stringify({
        cc: phoneNumber.slice(0, 2),
        phone_number: phoneNumber.slice(2),
        pin: pin || undefined,
      }),
    },
    accessToken
  );
}

/**
 * Request verification code (OTP) for phone number
 */
export async function requestVerificationCode(
  phoneNumberId: string,
  method: 'SMS' | 'VOICE',
  accessToken: string,
  locale?: string
): Promise<{ success: boolean }> {
  return makeRequest(
    `/${phoneNumberId}/request_code`,
    {
      method: 'POST',
      body: JSON.stringify({
        code_method: method,
        language: locale || 'pt_BR',
      }),
    },
    accessToken
  );
}

/**
 * Verify phone number with OTP code
 */
export async function verifyPhoneNumber(
  phoneNumberId: string,
  code: string,
  accessToken: string
): Promise<{ success: boolean; id?: string }> {
  return makeRequest(
    `/${phoneNumberId}/verify_code`,
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    },
    accessToken
  );
}

/**
 * Deregister phone number
 */
export async function deregisterPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return makeRequest(
    `/${phoneNumberId}/deregister`,
    { method: 'POST', body: JSON.stringify({}) },
    accessToken
  );
}

/**
 * Set default phone number for WABA
 */
export async function setDefaultPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return makeRequest(
    `/${phoneNumberId}/set_default`,
    { method: 'POST', body: JSON.stringify({}) },
    accessToken
  );
}

// ============================================================================
// TEMPLATES FUNCTIONS
// ============================================================================

/**
 * List all message templates for a WABA
 */
export async function listTemplates(
  wabaId: string,
  accessToken: string,
  limit: number = 100,
  after?: string
): Promise<{ data: Template[]; paging?: { cursors: { before: string; after: string } } }> {
  let endpoint = `/${wabaId}/message_templates?limit=${limit}`;
  if (after) {
    endpoint += `&after=${after}`;
  }
  
  return makeRequest(endpoint, { method: 'GET' }, accessToken);
}

/**
 * Get specific template details
 */
export async function getTemplate(
  templateId: string,
  accessToken: string
): Promise<Template> {
  return makeRequest(
    `/${templateId}?fields=id,name,language,status,category,components`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Create a new message template
 */
export async function createTemplate(
  wabaId: string,
  template: {
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    components: TemplateComponent[];
  },
  accessToken: string
): Promise<{ id: string; status: string }> {
  return makeRequest(
    `/${wabaId}/message_templates`,
    {
      method: 'POST',
      body: JSON.stringify(template),
    },
    accessToken
  );
}

/**
 * Delete a message template
 */
export async function deleteTemplate(
  wabaId: string,
  templateName: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return makeRequest(
    `/${wabaId}/message_templates?name=${templateName}`,
    { method: 'DELETE' },
    accessToken
  );
}

/**
 * Get template analytics/quality score
 */
export async function getTemplateAnalytics(
  wabaId: string,
  templateId: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<{
  data: Array<{
    template_id: string;
    sent: number;
    delivered: number;
    read: number;
    clicked?: number;
  }>;
}> {
  return makeRequest(
    `/${wabaId}/template_analytics?start=${startDate}&end=${endDate}&granularity=daily&template_ids=["${templateId}"]`,
    { method: 'GET' },
    accessToken
  );
}

// ============================================================================
// MESSAGES FUNCTIONS
// ============================================================================

/**
 * Send a text message
 */
export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
  accessToken: string,
  previewUrl: boolean = false
): Promise<MessageResponse> {
  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: previewUrl,
          body: text,
        },
      }),
    },
    accessToken
  );
}

/**
 * Send a template message (internal implementation)
 */
async function sendTemplateMessageInternal(
  phoneNumberId: string,
  to: string,
  templateName: string,
  languageCode: string,
  accessToken: string,
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: { fallback_value: string; code: string; amount_1000: number };
      date_time?: { fallback_value: string };
      image?: { link: string };
      document?: { link: string; filename?: string };
      video?: { link: string };
    }>;
  }>
): Promise<MessageResponse> {
  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      }),
    },
    accessToken
  );
}

/**
 * Send a media message (image, video, document, audio)
 */
export async function sendMediaMessage(
  phoneNumberId: string,
  to: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  mediaUrl: string,
  accessToken: string,
  caption?: string,
  filename?: string
): Promise<MessageResponse> {
  const mediaPayload: Record<string, unknown> = {
    link: mediaUrl,
  };

  if (caption && mediaType !== 'audio') {
    mediaPayload.caption = caption;
  }

  if (filename && mediaType === 'document') {
    mediaPayload.filename = filename;
  }

  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: mediaType,
        [mediaType]: mediaPayload,
      }),
    },
    accessToken
  );
}

/**
 * Send a location message
 */
export async function sendLocationMessage(
  phoneNumberId: string,
  to: string,
  latitude: number,
  longitude: number,
  accessToken: string,
  name?: string,
  address?: string
): Promise<MessageResponse> {
  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'location',
        location: {
          latitude,
          longitude,
          name: name || '',
          address: address || '',
        },
      }),
    },
    accessToken
  );
}

/**
 * Send an interactive message (buttons, list, etc.)
 */
export async function sendInteractiveMessage(
  phoneNumberId: string,
  to: string,
  interactive: {
    type: 'button' | 'list' | 'product' | 'product_list' | 'catalog_message' | 'flow' | 'cta_url' | 'location_request_message' | 'address_message';
    [key: string]: unknown;
  },
  accessToken: string
): Promise<MessageResponse> {
  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive,
      }),
    },
    accessToken
  );
}

/**
 * Send a reaction to a message
 */
export async function sendReaction(
  phoneNumberId: string,
  to: string,
  messageId: string,
  emoji: string,
  accessToken: string
): Promise<MessageResponse> {
  return makeRequest(
    `/${phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'reaction',
        reaction: {
          message_id: messageId,
          emoji,
        },
      }),
    },
    accessToken
  );
}

/**
 * Get message status/read receipts
 */
export async function getMessageStatus(
  messageId: string,
  accessToken: string
): Promise<{
  messaging_product: string;
  id: string;
  status: string;
  timestamp: string;
  recipient_id?: string;
  conversation?: {
    id: string;
    origin: { type: string };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}> {
  return makeRequest(
    `/${messageId}?fields=id,status,timestamp,recipient_id,conversation,pricing`,
    { method: 'GET' },
    accessToken
  );
}

// ============================================================================
// WEBHOOK FUNCTIONS
// ============================================================================

/**
 * Get webhook subscriptions for an app
 */
export async function getWebhookSubscriptions(
  appId: string,
  accessToken: string
): Promise<{
  data: Array<{
    object: string;
    callback_url: string;
    fields: string[];
    active: boolean;
  }>;
}> {
  return makeRequest(
    `/${appId}/subscriptions`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Subscribe to webhook fields
 */
export async function subscribeToWebhooks(
  appId: string,
  callbackUrl: string,
  verifyToken: string,
  fields: string[],
  accessToken: string
): Promise<{ success: boolean }> {
  const fieldsString = fields.join(',');
  
  return makeRequest(
    `/${appId}/subscriptions?object=whatsapp_business_account&callback_url=${encodeURIComponent(
      callbackUrl
    )}&verify_token=${verifyToken}&fields=${fieldsString}`,
    { method: 'POST' },
    accessToken
  );
}

/**
 * Unsubscribe from webhooks
 */
export async function unsubscribeFromWebhooks(
  appId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  return makeRequest(
    `/${appId}/subscriptions`,
    { method: 'DELETE' },
    accessToken
  );
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get analytics for a WABA
 */
export async function getAnalytics(
  wabaId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  granularity: 'DAILY' | 'MONTHLY' = 'DAILY'
): Promise<{
  data: Array<{
    start: number;
    end: number;
    conversation: number;
    phone_number: string;
    country: string;
    type: string;
    category: string;
  }>;
}> {
  return makeRequest(
    `/${wabaId}?fields=conversation_analytics.start(${startDate}).end(${endDate}).granularity(${granularity})`,
    { method: 'GET' },
    accessToken
  );
}

/**
 * Get phone number quality score
 */
export async function getPhoneNumberQuality(
  phoneNumberId: string,
  accessToken: string
): Promise<{
  id: string;
  quality_score: {
    score: 'GREEN' | 'YELLOW' | 'RED';
    date: string;
    reasons: string[];
  };
}> {
  return makeRequest(
    `/${phoneNumberId}/quality_ratings?fields=quality_score`,
    { method: 'GET' },
    accessToken
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format phone number to international format (remove + and non-digits)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Check if phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = formatPhoneNumber(phoneNumber);
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Extract error details from API response
 */
export function extractErrorDetails(error: unknown): {
  code: number;
  message: string;
  type: string;
} {
  if (error instanceof WhatsAppApiError) {
    return {
      code: error.code,
      message: error.message,
      type: error.type,
    };
  }

  if (error instanceof Error) {
    return {
      code: 500,
      message: error.message,
      type: 'InternalError',
    };
  }

  return {
    code: 500,
    message: 'Unknown error occurred',
    type: 'UnknownError',
  };
}

// ============================================================================
// WRAPPER FUNCTIONS (Instance-based)
// ============================================================================

import { WhatsAppInstance } from "@prisma/client";

interface SendTemplateMessageOptions {
  instance: WhatsAppInstance;
  to: string;
  templateName: string;
  language: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
    }>;
  }>;
}

interface SendTemplateResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a template message using instance object
 * Wrapper for the main sendTemplateMessage function
 */
export async function sendTemplateMessage({
  instance,
  to,
  templateName,
  language,
  components,
}: SendTemplateMessageOptions): Promise<SendTemplateResult> {
  try {
    if (!instance.phoneNumberId || !instance.accessToken) {
      return {
        success: false,
        error: 'Instância não configurada corretamente (falta phoneNumberId ou accessToken)',
      };
    }

    const response = await sendTemplateMessageInternal(
      instance.phoneNumberId,
      to,
      templateName,
      language,
      instance.accessToken,
      components
    );
    
    return {
      success: true,
      messageId: response.messages?.[0]?.id,
    };
  } catch (error) {
    const details = extractErrorDetails(error);
    return {
      success: false,
      error: `[${details.code}] ${details.message}`,
    };
  }
}

interface SendDocumentMessageOptions {
  instance: WhatsAppInstance;
  to: string;
  mediaId: string;
  filename: string;
  caption?: string;
}

interface SendDocumentResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a document message using media_id (from uploaded media)
 */
export async function sendDocumentMessage({
  instance,
  to,
  mediaId,
  filename,
  caption,
}: SendDocumentMessageOptions): Promise<SendDocumentResult> {
  try {
    if (!instance.phoneNumberId || !instance.accessToken) {
      return {
        success: false,
        error: 'Instância não configurada corretamente',
      };
    }

    const endpoint = `/${instance.phoneNumberId}/messages`;
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instance.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          id: mediaId,
          filename,
          caption,
        },
      }),
    });

    const data = await response.json() as WhatsAppApiResponse<MessageResponse>;

    if (!response.ok || data.error) {
      if (data.error) {
        return {
          success: false,
          error: `[${data.error.code}] ${data.error.message}`,
        };
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      messageId: data.data?.messages?.[0]?.id,
    };
  } catch (error) {
    const details = extractErrorDetails(error);
    return {
      success: false,
      error: `[${details.code}] ${details.message}`,
    };
  }
}
