/**
 * WhatsApp Messages Send API Route
 * POST: Send a message (text, media, location, interactive)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendTextMessage,
  sendMediaMessage,
  sendLocationMessage,
  sendInteractiveMessage,
  sendReaction,
  WhatsAppApiError,
  extractErrorDetails,
  isValidPhoneNumber,
} from '@/lib/whatsapp/cloud-api';

type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio' | 'location' | 'interactive' | 'reaction';

interface BaseMessageRequest {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  type: MessageType;
}

interface TextMessageRequest extends BaseMessageRequest {
  type: 'text';
  text: string;
  previewUrl?: boolean;
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

interface ReactionMessageRequest extends BaseMessageRequest {
  type: 'reaction';
  messageId: string;
  emoji: string;
}

type MessageRequest =
  | TextMessageRequest
  | MediaMessageRequest
  | LocationMessageRequest
  | InteractiveMessageRequest
  | ReactionMessageRequest;

function validateMessageBody(body: unknown): body is MessageRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const base = body as BaseMessageRequest;

  if (
    typeof base.accessToken !== 'string' ||
    typeof base.phoneNumberId !== 'string' ||
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
    case 'reaction': {
      const reacBody = body as ReactionMessageRequest;
      return (
        typeof reacBody.messageId === 'string' &&
        typeof reacBody.emoji === 'string'
      );
    }
    default:
      return false;
  }
}

/**
 * POST /api/whatsapp/messages/send
 * Send a WhatsApp message
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
            text: 'accessToken, phoneNumberId, to, type: "text", text (string), previewUrl (optional)',
            image: 'accessToken, phoneNumberId, to, type: "image", mediaUrl (string), caption (optional)',
            video: 'accessToken, phoneNumberId, to, type: "video", mediaUrl (string), caption (optional)',
            document: 'accessToken, phoneNumberId, to, type: "document", mediaUrl (string), filename (optional), caption (optional)',
            audio: 'accessToken, phoneNumberId, to, type: "audio", mediaUrl (string)',
            location: 'accessToken, phoneNumberId, to, type: "location", latitude (number), longitude (number), name (optional), address (optional)',
            interactive: 'accessToken, phoneNumberId, to, type: "interactive", interactive (object)',
            reaction: 'accessToken, phoneNumberId, to, type: "reaction", messageId (string), emoji (string)',
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

    const { accessToken, phoneNumberId, to } = body;
    const formattedPhone = body.to.replace(/\D/g, '');

    let result;

    switch (body.type) {
      case 'text': {
        result = await sendTextMessage(
          phoneNumberId,
          formattedPhone,
          body.text,
          accessToken,
          body.previewUrl
        );
        break;
      }

      case 'image':
      case 'video':
      case 'document':
      case 'audio': {
        result = await sendMediaMessage(
          phoneNumberId,
          formattedPhone,
          body.type,
          body.mediaUrl,
          accessToken,
          body.caption,
          body.filename
        );
        break;
      }

      case 'location': {
        result = await sendLocationMessage(
          phoneNumberId,
          formattedPhone,
          body.latitude,
          body.longitude,
          accessToken,
          body.name,
          body.address
        );
        break;
      }

      case 'interactive': {
        result = await sendInteractiveMessage(
          phoneNumberId,
          formattedPhone,
          body.interactive,
          accessToken
        );
        break;
      }

      case 'reaction': {
        result = await sendReaction(
          phoneNumberId,
          formattedPhone,
          body.messageId,
          body.emoji,
          accessToken
        );
        break;
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported message type',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sent: true,
        messageId: result.messages[0]?.id,
        recipientId: result.contacts[0]?.wa_id,
        messagingProduct: result.messaging_product,
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
