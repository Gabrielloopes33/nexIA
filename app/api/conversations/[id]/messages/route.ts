/**
 * Conversation Messages API
 * GET: Listar mensagens da conversa
 * POST: Enviar nova mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { evolutionService } from '@/lib/services/evolution-api';
import { sendTextMessage } from '@/lib/whatsapp/cloud-api';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages?limit=50&before=
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before');

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    // Verifica se conversa existe e pertence à organização
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const where: any = {
      conversationId: id,
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverte para ordem cronológica
    messages.reverse();

    return NextResponse.json({
      success: true,
      data: messages,
      meta: {
        hasMore: messages.length === limit,
        nextCursor: messages.length > 0 ? messages[0].createdAt : null,
      },
    });
  } catch (error) {
    console.error('Messages GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Enviar mensagem
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { id } = await params;
    const body = await request.json();

    const { content } = body;

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    // Verifica se conversa existe
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Validações
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // Busca dados do contato para obter o telefone
    const contact = await prisma.contact.findUnique({
      where: { id: conversation.contactId },
      select: { phone: true },
    });

    // Cria a mensagem no banco
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        contactId: conversation.contactId,
        content,
        direction: 'OUTBOUND',
        status: 'SENT',
      },
    });

    // Tenta enviar via instância conectada da organização (oficial tem prioridade)
    if (contact?.phone) {
      const [officialInstance, evolutionInstance] = await Promise.all([
        prisma.whatsAppInstance.findFirst({
          where: { organizationId, status: 'CONNECTED' },
          select: { phoneNumberId: true, accessToken: true },
        }),
        prisma.evolutionInstance.findFirst({
          where: { organizationId, status: 'CONNECTED' },
          select: { instanceName: true },
        }),
      ]);

      if (officialInstance?.phoneNumberId && officialInstance?.accessToken) {
        try {
          await sendTextMessage(officialInstance.phoneNumberId, contact.phone, content, officialInstance.accessToken);
          console.log('Messages POST: Sent via WhatsApp Cloud API');
        } catch (sendError) {
          console.error('Messages POST: WhatsApp Cloud API send failed:', sendError);
        }
      } else if (evolutionInstance) {
        try {
          await evolutionService.sendText(evolutionInstance.instanceName, contact.phone, content);
          console.log('Messages POST: Sent via Evolution API');
        } catch (sendError) {
          console.error('Messages POST: Evolution API send failed:', sendError);
        }
      } else {
        console.warn('Messages POST: No connected instance found for org', organizationId);
      }
    }

    // Atualiza a conversa
    await prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    }, { status: 201 });
  } catch (error) {
    console.error('Messages POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
