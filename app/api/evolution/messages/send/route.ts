import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

// POST /api/evolution/messages/send
// Body: { instanceId?, instanceName?, organizationId, phone, message }
// Nota: instanceId OU instanceName deve ser fornecido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, instanceName, organizationId, phone, message } = body;

    console.log('[Evolution Send] Request body:', { instanceId, instanceName, organizationId, phone, message: message?.substring(0, 50) });

    if (!phone || !message) {
      console.log('[Evolution Send] Missing fields:', { phone: !!phone, message: !!message });
      return NextResponse.json(
        { success: false, error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    // Precisamos de instanceId OU instanceName
    if (!instanceId && !instanceName) {
      return NextResponse.json(
        { success: false, error: 'Either instanceId or instanceName is required' },
        { status: 400 }
      );
    }

    // Precisamos do organizationId para salvar no banco
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    let instanceNameToUse: string;
    let instanceRecord;

    if (instanceId) {
      // Buscar pelo ID
      instanceRecord = await prisma.evolutionInstance.findFirst({
        where: { id: instanceId, organizationId },
      });

      if (!instanceRecord) {
        return NextResponse.json(
          { success: false, error: 'Instance not found' },
          { status: 404 }
        );
      }
      
      instanceNameToUse = instanceRecord.instanceName;
    } else {
      // Usar instanceName diretamente
      instanceNameToUse = instanceName;
      
      // Buscar para verificar se existe
      instanceRecord = await prisma.evolutionInstance.findFirst({
        where: { instanceName, organizationId },
      });
    }

    // Verificar status se temos o registro
    if (instanceRecord && instanceRecord.status !== 'CONNECTED') {
      return NextResponse.json(
        { success: false, error: 'Instance is not connected' },
        { status: 400 }
      );
    }

    // Buscar ou criar contato
    const phoneClean = phone.replace(/\D/g, '');
    let contact = await prisma.contact.findUnique({
      where: {
        organizationId_phone: {
          organizationId,
          phone: phoneClean,
        },
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId,
          phone: phoneClean,
          name: phoneClean, // Usar telefone como nome temporário
          status: 'ACTIVE',
        },
      });
      console.log('[Evolution Send] Created contact:', contact.id);
    }

    // Buscar ou criar conversa
    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId,
        contactId: contact.id,
        status: 'active',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId,
          contactId: contact.id,
          status: 'active',
        },
      });
      console.log('[Evolution Send] Created conversation:', conversation.id);
    }

    console.log(`[Evolution Send] Sending message via instance: ${instanceNameToUse} to phone: ${phone}`);

    // Send message via Evolution API
    let result;
    try {
      result = await evolutionService.sendText(
        instanceNameToUse,
        phone,
        message
      );
      console.log('[Evolution Send] Result:', JSON.stringify(result));
    } catch (serviceError) {
      console.error('[Evolution Send] Service error:', serviceError);
      throw serviceError;
    }

    // Salvar mensagem no banco
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        content: message,
        status: 'SENT',
        messageId: result.key?.id,
        direction: 'OUTBOUND',
      },
    });
    console.log('[Evolution Send] Saved message:', savedMessage.id);

    // Atualizar conversa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Increment message counter se temos o registro
    if (instanceRecord) {
      await prisma.evolutionInstance.update({
        where: { id: instanceRecord.id },
        data: {
          messagesSent: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.key?.id,
        status: result.status || 'sent',
        timestamp: result.messageTimestamp,
        conversationId: conversation.id,
      },
    });
  } catch (error) {
    console.error('[Evolution Send] Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
