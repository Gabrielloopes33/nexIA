/**
 * WhatsApp Messages Send API Route
 * POST: Send a message (text, media, location, interactive) and save to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendTextMessage,
  sendMediaMessage,
  sendLocationMessage,
  sendInteractiveMessage,
  sendTemplateMessage,
  WhatsAppApiError,
  extractErrorDetails,
  isValidPhoneNumber,
} from '@/lib/whatsapp/cloud-api';

type MessageType = 'text' | 'template' | 'image' | 'video' | 'document' | 'audio' | 'location' | 'interactive';

interface BaseMessageRequest {
  instanceId: string;
  to: string;
  type: MessageType;
}

interface TextMessageRequest extends BaseMessageRequest {
  type: 'text';
  text: string;
  previewUrl?: boolean;
}

interface TemplateMessageRequest extends BaseMessageRequest {
  type: 'template';
  templateName: string;
  language: string;
  components?: Record<string, unknown>[];
}

interface MediaMessageRequest extends BaseMessageRequest {
  type: 'image' | 'video' | 'document' | 'audio';
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

interface LocationMessageRequest extends BaseMessageRequest {
  type: 'location';
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

interface InteractiveMessageRequest extends BaseMessageRequest {
  type: 'interactive';
  interactive: {
    type: 'button' | 'list' | 'product' | 'product_list' | 'catalog_message' | 'flow' | 'cta_url' | 'location_request_message' | 'address_message';
    [key: string]: unknown;
  };
}

type MessageRequest =
  | TextMessageRequest
  | TemplateMessageRequest
  | MediaMessageRequest
  | LocationMessageRequest
  | InteractiveMessageRequest;

function validateMessageBody(body: unknown): body is MessageRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const base = body as BaseMessageRequest;

  if (
    typeof base.instanceId !== 'string' ||
    typeof base.to !== 'string' ||
    typeof base.type !== 'string'
  ) {
    return false;
  }

  switch (base.type) {
    case 'text': {
      const textBody = body as TextMessageRequest;
      return typeof textBody.text === 'string' && textBody.text.length > 0;
    }
    case 'template': {
      const templateBody = body as TemplateMessageRequest;
      return typeof templateBody.templateName === 'string' && 
             templateBody.templateName.length > 0 &&
             typeof templateBody.language === 'string';
    }
    case 'image':
    case 'video':
    case 'document':
    case 'audio': {
      const mediaBody = body as MediaMessageRequest;
      return typeof mediaBody.mediaUrl === 'string' && mediaBody.mediaUrl.length > 0;
    }
    case 'location': {
      const locBody = body as LocationMessageRequest;
      return (
        typeof locBody.latitude === 'number' &&
        typeof locBody.longitude === 'number'
      );
    }
    case 'interactive': {
      const intBody = body as InteractiveMessageRequest;
      return typeof intBody.interactive === 'object' && intBody.interactive !== null;
    }
    default:
      return false;
  }
}

/**
 * Helper: Find or create contact
 */
async function findOrCreateContact(organizationId: string, phone: string) {
  let contact = await prisma.contact.findUnique({
    where: {
      organizationId_phone: {
        organizationId,
        phone,
      },
    },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        organizationId,
        phone,
        status: 'ACTIVE',
      },
    });
  }

  return contact;
}

/**
 * Helper: Find or create conversation
 */
async function findOrCreateConversation(
  organizationId: string,
  contactId: string,
) {
  let conversation = await prisma.conversation.findFirst({
    where: {
      organizationId,
      contactId,
      status: 'active',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        contactId,
        status: 'active',
      },
    });
  }

  return conversation;
}

/**
 * POST /api/whatsapp/messages/send
 * Send a WhatsApp message and save to database
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateMessageBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required fields depend on message type.',
          types: {
            text: 'instanceId, to, type: "text", text (string), previewUrl (optional)',
            template: 'instanceId, to, type: "template", templateName (string), language (string), components (optional)',
            image: 'instanceId, to, type: "image", mediaUrl (string), caption (optional)',
            video: 'instanceId, to, type: "video", mediaUrl (string), caption (optional)',
            document: 'instanceId, to, type: "document", mediaUrl (string), filename (optional), caption (optional)',
            audio: 'instanceId, to, type: "audio", mediaUrl (string)',
            location: 'instanceId, to, type: "location", latitude (number), longitude (number), name (optional), address (optional)',
            interactive: 'instanceId, to, type: "interactive", interactive (object)',
          },
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!isValidPhoneNumber(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format. Must be in international format (e.g., 5511999999999)',
        },
        { status: 400 }
      );
    }

    const { instanceId, to, type } = body;
    const formattedPhone = body.to.replace(/\D/g, '');

    // Fetch the WhatsApp instance
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp instance not found' },
        { status: 404 }
      );
    }

    if (instance.status !== 'CONNECTED') {
      return NextResponse.json(
        { success: false, error: 'WhatsApp instance is not connected' },
        { status: 400 }
      );
    }

    if (!instance.accessToken || !instance.phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp instance is missing credentials' },
        { status: 400 }
      );
    }

    const accessToken = instance.accessToken;
    const phoneNumberId = instance.phoneNumberId;

    // Find or create contact
    const contact = await findOrCreateContact(instance.organizationId, formattedPhone);

    // Find or create conversation
    const conversation = await findOrCreateConversation(
      instance.organizationId,
      contact.id,
    );

    let result;
    let messageContent = '';

    // Send message based on type
    switch (type) {
      case 'text': {
        const textBody = body as TextMessageRequest;
        result = await sendTextMessage(
          phoneNumberId,
          formattedPhone,
          textBody.text,
          accessToken,
          textBody.previewUrl
        );
        messageContent = textBody.text;
        break;
      }

      case 'template': {
        const templateBody = body as TemplateMessageRequest;
        result = await sendTemplateMessage(
          phoneNumberId,
          formattedPhone,
          templateBody.templateName,
          templateBody.language,
          accessToken,
          templateBody.components
        );
        messageContent = `[Template: ${templateBody.templateName}]`;
        break;
      }

      case 'image':
      case 'video':
      case 'document':
      case 'audio': {
        const mediaBody = body as MediaMessageRequest;
        result = await sendMediaMessage(
          phoneNumberId,
          formattedPhone,
          type,
          mediaBody.mediaUrl,
          accessToken,
          mediaBody.caption,
          mediaBody.filename
        );
        messageContent = mediaBody.caption || `[${type.toUpperCase()}]`;
        break;
      }

      case 'location': {
        const locBody = body as LocationMessageRequest;
        result = await sendLocationMessage(
          phoneNumberId,
          formattedPhone,
          locBody.latitude,
          locBody.longitude,
          accessToken,
          locBody.name,
          locBody.address
        );
        messageContent = `[Localização: ${locBody.name || `${locBody.latitude}, ${locBody.longitude}`}]`;
        break;
      }

      case 'interactive': {
        const intBody = body as InteractiveMessageRequest;
        result = await sendInteractiveMessage(
          phoneNumberId,
          formattedPhone,
          intBody.interactive,
          accessToken
        );
        messageContent = '[Mensagem Interativa]';
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Unsupported message type' },
          { status: 400 }
        );
      }
    }

    // Get message ID from Meta response
    const messageId = result.messages?.[0]?.id;

    // Create message in database (only fields that exist in the schema)
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        messageId: messageId || null,
        direction: 'OUTBOUND',
        content: messageContent,
        status: 'sent',
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Update contact last interaction
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        lastInteractionAt: new Date(),
      },
    });

    console.log('[Send] Message sent and saved:', { messageId, to: formattedPhone, type });

    return NextResponse.json({
      success: true,
      data: {
        sent: true,
        messageId: result.messages?.[0]?.id,
        recipientId: result.contacts?.[0]?.wa_id,
        messagingProduct: result.messaging_product,
        message,
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Send Message Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          errorCode: code,
          errorType: type,
        },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
