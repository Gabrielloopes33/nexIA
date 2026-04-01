/**
 * WhatsApp Webhook Handler
 * Process and validate incoming webhook events from Meta
 */

import { createHmac } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WebhookContact[];
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
  errors?: WebhookError[];
  messaging_template?: WebhookTemplateUpdate;
}

export interface WebhookContact {
  wa_id: string;
  profile: {
    name: string;
  };
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction' | 'order' | 'system' | 'unknown';
  context?: {
    from: string;
    id: string;
  };
  text?: {
    body: string;
  };
  image?: WebhookMedia;
  video?: WebhookMedia;
  audio?: WebhookMedia;
  document?: WebhookMedia & { filename: string };
  sticker?: WebhookMedia;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    addresses?: Array<{
      city?: string;
      country?: string;
      country_code?: string;
      state?: string;
      street?: string;
      type?: string;
      zip?: string;
    }>;
    birthday?: string;
    emails?: Array<{ email: string; type?: string }>;
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
    phones?: Array<{ phone: string; type?: string; wa_id?: string }>;
    urls?: Array<{ url: string; type?: string }>;
  }>;
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  button?: {
    payload: string;
    text: string;
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
  order?: {
    catalog_id: string;
    product_items: Array<{
      product_retailer_id: string;
      quantity: number;
      item_price: number;
      currency: string;
    }>;
    text?: string;
  };
  system?: {
    body: string;
    identity: string;
    wa_id: string;
    type: 'customer_identity_changed' | 'customer_changed_number' | 'user_changed_number';
  };
  errors?: WebhookError[];
}

export interface WebhookMedia {
  mime_type: string;
  sha256: string;
  id: string;
  caption?: string;
}

export interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: 'business_initiated' | 'user_initiated' | 'referral_conversion';
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: WebhookError[];
}

export interface WebhookError {
  code: number;
  title: string;
  message: string;
  error_data?: {
    details: string;
  };
}

export interface WebhookTemplateUpdate {
  id: string;
  name: string;
  previous_category: string;
  new_category: string;
  language: string;
  status_update?: {
    previous_status: string;
    new_status: string;
  };
  quality_update?: {
    previous_quality_score: string;
    new_quality_score: string;
  };
}

export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookVerificationParams {
  mode: string;
  token: string;
  challenge: string;
}

export interface ProcessedEvent {
  type: 'message' | 'status' | 'template_update' | 'error';
  phoneNumberId: string;
  displayPhoneNumber?: string;
  payload: unknown;
  timestamp: Date;
}

// ============================================================================
// WEBHOOK VALIDATION
// ============================================================================

/**
 * Validate webhook signature from Meta
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  // Meta sends signature as "sha256=<signature>"
  const receivedSignature = signature.replace('sha256=', '');

  try {
    return timingSafeEqual(expectedSignature, receivedSignature);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verify webhook subscription challenge
 */
export function verifyWebhookChallenge(
  params: WebhookVerificationParams,
  verifyToken: string
): string | null {
  if (params.mode !== 'subscribe') {
    return null;
  }

  if (params.token !== verifyToken) {
    return null;
  }

  return params.challenge;
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process incoming webhook payload
 */
export function processWebhookPayload(payload: WebhookPayload): ProcessedEvent[] {
  const events: ProcessedEvent[] = [];

  if (payload.object !== 'whatsapp_business_account') {
    return events;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') {
        continue;
      }

      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id;
      const displayPhoneNumber = value.metadata?.display_phone_number;

      if (!phoneNumberId) {
        continue;
      }

      // Process messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          events.push({
            type: 'message',
            phoneNumberId,
            displayPhoneNumber,
            payload: {
              message,
              contact: value.contacts?.[0],
            },
            timestamp: new Date(parseInt(message.timestamp) * 1000),
          });
        }
      }

      // Process status updates
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          events.push({
            type: 'status',
            phoneNumberId,
            displayPhoneNumber,
            payload: status,
            timestamp: new Date(parseInt(status.timestamp) * 1000),
          });
        }
      }

      // Process template updates
      if (value.messaging_template) {
        events.push({
          type: 'template_update',
          phoneNumberId,
          displayPhoneNumber,
          payload: value.messaging_template,
          timestamp: new Date(),
        });
      }

      // Process errors
      if (value.errors && value.errors.length > 0) {
        for (const error of value.errors) {
          events.push({
            type: 'error',
            phoneNumberId,
            displayPhoneNumber,
            payload: error,
            timestamp: new Date(),
          });
        }
      }
    }
  }

  return events;
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Extract text from a message
 */
export function extractMessageText(message: WebhookMessage): string | null {
  switch (message.type) {
    case 'text':
      return message.text?.body || null;
    case 'image':
      return message.image?.caption || '[Image]';
    case 'video':
      return message.video?.caption || '[Video]';
    case 'audio':
      return '[Audio]';
    case 'document':
      return message.document?.filename || '[Document]';
    case 'sticker':
      return '[Sticker]';
    case 'location':
      return `[Location: ${message.location?.name || 'Unknown'}]`;
    case 'contacts':
      return '[Contact shared]';
    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        return message.interactive.button_reply?.title || '[Button reply]';
      }
      if (message.interactive?.type === 'list_reply') {
        return message.interactive.list_reply?.title || '[List reply]';
      }
      return '[Interactive message]';
    case 'button':
      return message.button?.text || '[Button]';
    case 'reaction':
      return `[Reaction: ${message.reaction?.emoji || ''}]`;
    case 'order':
      return '[Order]';
    case 'system':
      return message.system?.body || '[System message]';
    default:
      return '[Unknown message type]';
  }
}

/**
 * Get media URL for a message (requires separate API call to download)
 */
export function getMediaId(message: WebhookMessage): string | null {
  switch (message.type) {
    case 'image':
      return message.image?.id || null;
    case 'video':
      return message.video?.id || null;
    case 'audio':
      return message.audio?.id || null;
    case 'document':
      return message.document?.id || null;
    case 'sticker':
      return message.sticker?.id || null;
    default:
      return null;
  }
}

/**
 * Check if message is a reply to another message
 */
export function isReply(message: WebhookMessage): boolean {
  return !!message.context;
}

/**
 * Get the ID of the message being replied to
 */
export function getReplyToMessageId(message: WebhookMessage): string | null {
  return message.context?.id || null;
}

// ============================================================================
// STATUS HANDLERS
// ============================================================================

/**
 * Check if status is final (delivered, read, or failed)
 */
export function isFinalStatus(status: WebhookStatus): boolean {
  return ['delivered', 'read', 'failed'].includes(status.status);
}

/**
 * Check if message was delivered
 */
export function isDelivered(status: WebhookStatus): boolean {
  return status.status === 'delivered' || status.status === 'read';
}

/**
 * Check if message was read
 */
export function isRead(status: WebhookStatus): boolean {
  return status.status === 'read';
}

/**
 * Check if message failed
 */
export function isFailed(status: WebhookStatus): boolean {
  return status.status === 'failed';
}

/**
 * Get error details from failed status
 */
export function getErrorDetails(status: WebhookStatus): WebhookError | null {
  if (!isFailed(status) || !status.errors || status.errors.length === 0) {
    return null;
  }
  return status.errors[0];
}

// ============================================================================
// EVENT DISPATCHER (Callback-based)
// ============================================================================

type MessageHandler = (event: {
  message: WebhookMessage;
  contact?: WebhookContact;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  timestamp: Date;
}) => void | Promise<void>;

type StatusHandler = (event: {
  status: WebhookStatus;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  timestamp: Date;
}) => void | Promise<void>;

type TemplateUpdateHandler = (event: {
  template: WebhookTemplateUpdate;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  timestamp: Date;
}) => void | Promise<void>;

type ErrorHandler = (event: {
  error: WebhookError;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  timestamp: Date;
}) => void | Promise<void>;

export interface WebhookEventHandlers {
  onMessage?: MessageHandler;
  onStatus?: StatusHandler;
  onTemplateUpdate?: TemplateUpdateHandler;
  onError?: ErrorHandler;
}

/**
 * Dispatch webhook events to registered handlers
 */
export async function dispatchEvents(
  events: ProcessedEvent[],
  handlers: WebhookEventHandlers
): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'message': {
        if (handlers.onMessage) {
          const { message, contact } = event.payload as {
            message: WebhookMessage;
            contact?: WebhookContact;
          };
          promises.push(
            Promise.resolve(
              handlers.onMessage({
                message,
                contact,
                phoneNumberId: event.phoneNumberId,
                displayPhoneNumber: event.displayPhoneNumber,
                timestamp: event.timestamp,
              })
            ).catch(console.error)
          );
        }
        break;
      }

      case 'status': {
        if (handlers.onStatus) {
          const status = event.payload as WebhookStatus;
          promises.push(
            Promise.resolve(
              handlers.onStatus({
                status,
                phoneNumberId: event.phoneNumberId,
                displayPhoneNumber: event.displayPhoneNumber,
                timestamp: event.timestamp,
              })
            ).catch(console.error)
          );
        }
        break;
      }

      case 'template_update': {
        if (handlers.onTemplateUpdate) {
          const template = event.payload as WebhookTemplateUpdate;
          promises.push(
            Promise.resolve(
              handlers.onTemplateUpdate({
                template,
                phoneNumberId: event.phoneNumberId,
                displayPhoneNumber: event.displayPhoneNumber,
                timestamp: event.timestamp,
              })
            ).catch(console.error)
          );
        }
        break;
      }

      case 'error': {
        if (handlers.onError) {
          const error = event.payload as WebhookError;
          promises.push(
            Promise.resolve(
              handlers.onError({
                error,
                phoneNumberId: event.phoneNumberId,
                displayPhoneNumber: event.displayPhoneNumber,
                timestamp: event.timestamp,
              })
            ).catch(console.error)
          );
        }
        break;
      }
    }
  }

  await Promise.all(promises);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse webhook payload from JSON string
 */
export function parseWebhookPayload(body: string): WebhookPayload | null {
  try {
    const parsed = JSON.parse(body) as WebhookPayload;
    
    if (parsed.object !== 'whatsapp_business_account' || !Array.isArray(parsed.entry)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Filter events by phone number ID
 */
export function filterEventsByPhoneNumber(
  events: ProcessedEvent[],
  phoneNumberId: string
): ProcessedEvent[] {
  return events.filter((event) => event.phoneNumberId === phoneNumberId);
}

/**
 * Filter events by type
 */
export function filterEventsByType<T extends ProcessedEvent['type']>(
  events: ProcessedEvent[],
  type: T
): Array<ProcessedEvent & { type: T }> {
  return events.filter((event): event is ProcessedEvent & { type: T } => event.type === type);
}

/**
 * Get unique phone number IDs from events
 */
export function getUniquePhoneNumberIds(events: ProcessedEvent[]): string[] {
  return Array.from(new Set(events.map((event) => event.phoneNumberId)));
}

/**
 * Group events by phone number ID
 */
export function groupEventsByPhoneNumber(
  events: ProcessedEvent[]
): Record<string, ProcessedEvent[]> {
  return events.reduce((acc, event) => {
    if (!acc[event.phoneNumberId]) {
      acc[event.phoneNumberId] = [];
    }
    acc[event.phoneNumberId].push(event);
    return acc;
  }, {} as Record<string, ProcessedEvent[]>);
}

/**
 * Get latest event timestamp from a batch
 */
export function getLatestTimestamp(events: ProcessedEvent[]): Date | null {
  if (events.length === 0) return null;
  
  return events.reduce((latest, event) => 
    event.timestamp > latest ? event.timestamp : latest,
    events[0].timestamp
  );
}

/**
 * Check if webhook is a duplicate (based on message/ status ID)
 */
export function isDuplicateEvent(
  event: ProcessedEvent,
  processedIds: Set<string>
): boolean {
  let id: string | undefined;

  if (event.type === 'message') {
    const { message } = event.payload as { message: WebhookMessage };
    id = message.id;
  } else if (event.type === 'status') {
    const status = event.payload as WebhookStatus;
    id = status.id;
  }

  if (!id) return false;
  
  if (processedIds.has(id)) {
    return true;
  }

  processedIds.add(id);
  
  // Limit set size to prevent memory issues
  if (processedIds.size > 10000) {
    const iterator = processedIds.values();
    processedIds.delete(iterator.next().value as string);
  }

  return false;
}
