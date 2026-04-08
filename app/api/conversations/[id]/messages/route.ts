/**
 * Conversation Messages API
 * GET: Listar mensagens da conversa
 * POST: Enviar nova mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { evolutionService } from '@/lib/services/evolution-api';
import { sendTextMessage, WhatsAppApiError } from '@/lib/whatsapp/cloud-api';

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

    // Busca dados do contato e do usuário atual para obter o telefone e nome
    const [contact, currentUser] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: conversation.contactId },
        select: { phone: true },
      }),
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, name: true, email: true },
      }),
    ]);

    // Cria a mensagem no banco com metadata do sender
    let message = await prisma.message.create({
      data: {
        conversationId: id,
        contactId: conversation.contactId,
        content,
        direction: 'OUTBOUND',
        status: 'sent',
        metadata: currentUser ? {
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
        } : undefined,
      },
    });

    let sentMessageId: string | undefined;

    // Tenta enviar via instância associada à conversa ou busca uma disponível
    if (contact?.phone) {
      let officialInstance: { phoneNumberId: string | null; accessToken: string | null } | null = null;
      let evolutionInstance: { instanceName: string } | null = null;

      // Se a conversa tem instanceId e instanceType, usa a instância específica
      if (conversation.instanceId && conversation.instanceType) {
        console.log(`Messages POST: Using conversation instance ${conversation.instanceId} (${conversation.instanceType})`);
        
        if (conversation.instanceType === 'OFFICIAL') {
          officialInstance = await prisma.whatsAppInstance.findFirst({
            where: { id: conversation.instanceId, organizationId, status: 'CONNECTED' },
            select: { phoneNumberId: true, accessToken: true },
          });
        } else if (conversation.instanceType === 'EVOLUTION') {
          evolutionInstance = await prisma.evolutionInstance.findFirst({
            where: { id: conversation.instanceId, organizationId, status: 'CONNECTED' },
            select: { instanceName: true },
          });
        }
      }

      // Se não encontrou a instância específica ou não tem instanceId na conversa, busca qualquer uma conectada
      if (!officialInstance && !evolutionInstance) {
        console.log('Messages POST: No specific instance found, searching for any connected instance...');
        const [offInst, evoInst] = await Promise.all([
          prisma.whatsAppInstance.findFirst({
            where: { organizationId, status: 'CONNECTED' },
            select: { phoneNumberId: true, accessToken: true },
          }),
          prisma.evolutionInstance.findFirst({
            where: { organizationId, status: 'CONNECTED' },
            select: { instanceName: true },
          }),
        ]);
        officialInstance = offInst;
        evolutionInstance = evoInst;
      }

      let sendError: Error | null = null;

      if (officialInstance?.phoneNumberId && officialInstance?.accessToken) {
        try {
          const result = await sendTextMessage(officialInstance.phoneNumberId, contact.phone, content, officialInstance.accessToken);
          sentMessageId = (result as any).messages?.[0]?.id;
          console.log('Messages POST: Sent via WhatsApp Cloud API. messageId:', sentMessageId);
        } catch (err) {
          sendError = err instanceof Error ? err : new Error(String(err));
          console.error('Messages POST: WhatsApp Cloud API send failed:', sendError);
          
          // Atualiza mensagem com erro
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              metadata: {
                ...((message.metadata as object) || {}),
                error: sendError.message,
                errorType: err instanceof WhatsAppApiError ? err.type : 'Unknown',
                errorCode: err instanceof WhatsAppApiError ? err.code : undefined,
              },
            },
          });
        }
      } else if (evolutionInstance) {
        try {
          const result = await evolutionService.sendText(evolutionInstance.instanceName, contact.phone, content);
          sentMessageId = (result as any).key?.id;
          console.log('Messages POST: Sent via Evolution API. messageId:', sentMessageId);
        } catch (err) {
          sendError = err instanceof Error ? err : new Error(String(err));
          console.error('Messages POST: Evolution API send failed:', sendError);
          
          // Atualiza mensagem com erro
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              metadata: {
                ...((message.metadata as object) || {}),
                error: sendError.message,
              },
            },
          });
        }
      } else {
        console.warn('Messages POST: No connected instance found for org', organizationId);
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: 'failed',
            metadata: {
              ...((message.metadata as object) || {}),
              error: 'Nenhuma instância WhatsApp conectada encontrada',
            },
          },
        });
      }
    }

    // Atualiza a mensagem com o messageId retornado (crítico para webhooks de status)
    if (sentMessageId) {
      message = await prisma.message.update({
        where: { id: message.id },
        data: {
          messageId: sentMessageId,
          status: 'sent',
        },
      });
    }

    // Atualiza a conversa
    await prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Retorna erro se falhou o envio
    if (!sentMessageId) {
      const errorMessage = sendError?.message || '';
      
      // Detecta erro específico de API desativada
      if (errorMessage.includes('API access deactivated') || errorMessage.includes('developer registration')) {
        return NextResponse.json({
          success: false,
          error: 'Acesso à API do WhatsApp desativado. O administrador precisa completar o registro em developer.facebook.com ou reconectar a conta.',
          errorCode: 'WHATSAPP_API_DEACTIVATED',
          data: message,
        }, { status: 403 });
      }
      
      // Detecta erro de objeto não existe (phoneNumberId inválido)
      if (errorMessage.includes('does not exist') || errorMessage.includes('missing permissions')) {
        return NextResponse.json({
          success: false,
          error: 'Instância WhatsApp inválida ou sem permissões. Tente reconectar a conta em Configurações > Integrações > WhatsApp.',
          errorCode: 'WHATSAPP_INVALID_INSTANCE',
          data: message,
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        error: 'Falha ao enviar mensagem para o WhatsApp. A mensagem foi salva mas não entregue.',
        details: sendError?.message,
        data: message,
      }, { status: 502 });
    }

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
