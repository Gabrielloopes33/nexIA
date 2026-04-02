import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface TimelineEvent {
  id: string;
  type: 'note' | 'call' | 'meeting' | 'task' | 'deal' | 'whatsapp' | 'message';
  title: string;
  description?: string;
  date: string;
  author: string;
  authorAvatar?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/contacts/[id]/timeline
 * Retorna timeline unificada do contato (schedules, deals, messages)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('[Timeline API] Request:', { contactId: id, organizationId, limit });

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Buscar dados em paralelo
    console.log('[Timeline API] Fetching schedules, deals, conversations...');
    const [schedules, deals, conversations, contactWithNotes] = await Promise.all([
      // Schedules (tarefas, ligações, reuniões)
      prisma.schedule.findMany({
        where: { 
          contactId: id,
          organizationId,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // Deals (negócios)
      prisma.deal.findMany({
        where: { 
          contactId: id,
          organizationId,
        },
        include: {
          stage: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // Conversas do contato
      prisma.conversation.findMany({
        where: {
          contactId: id,
          organizationId,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),

      // Contato (para ler notas do metadata)
      prisma.contact.findUnique({
        where: { id },
        select: { metadata: true },
      }),
    ]);

    console.log('[Timeline API] Fetched:', { 
      schedulesCount: schedules.length, 
      dealsCount: deals.length, 
      conversationsCount: conversations.length 
    });

    // Buscar mensagens das conversas separadamente (schema nao tem relacao messages)
    const conversationIds = conversations.map(c => c.id);
    let messages: Array<{
      id: string;
      conversationId: string;
      content: string;
      direction: string;
      status: string;
      createdAt: Date;
    }> = [];
    
    if (conversationIds.length > 0) {
      messages = await prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      console.log('[Timeline API] Messages found:', messages.length);
    }

    // Buscar usuários atribuídos para schedules e deals
    const userIds = [
      ...schedules.map(s => s.assignedTo).filter((id): id is string => !!id),
      ...deals.map(d => d.assignedTo).filter((id): id is string => !!id),
    ];

    const uniqueUserIds = [...new Set(userIds)];
    
    console.log('[Timeline API] Fetching users:', uniqueUserIds);
    
    const users = uniqueUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));
    console.log('[Timeline API] Users found:', users.length);

    // Buscar atividades dos deals
    const dealIds = deals.map(d => d.id);
    console.log('[Timeline API] Deal IDs for activities:', dealIds);
    
    const dealActivities = dealIds.length > 0 
      ? await prisma.dealActivity.findMany({
          where: { 
            dealId: { in: dealIds },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : [];
    
    console.log('[Timeline API] Activities found:', dealActivities.length);

    // Construir timeline
    const timeline: TimelineEvent[] = [];

    // Adicionar schedules como eventos
    schedules.forEach(schedule => {
      const typeMap: Record<string, TimelineEvent['type']> = {
        'call': 'call',
        'meeting': 'meeting',
        'task': 'task',
        'deadline': 'task',
      };

      const assignedUser = schedule.assignedTo ? userMap.get(schedule.assignedTo) : null;

      timeline.push({
        id: `schedule-${schedule.id}`,
        type: typeMap[schedule.type] || 'task',
        title: schedule.title,
        description: schedule.description || undefined,
        date: schedule.createdAt.toISOString(),
        author: assignedUser?.name || 'Sistema',
        authorAvatar: assignedUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        metadata: {
          scheduleId: schedule.id,
          status: schedule.status,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    });

    // Adicionar deals como eventos
    deals.forEach(deal => {
      const assignedUser = deal.assignedTo ? userMap.get(deal.assignedTo) : null;

      timeline.push({
        id: `deal-${deal.id}`,
        type: 'deal',
        title: `Negócio criado: ${deal.title}`,
        description: deal.value 
          ? `Valor: R$ ${Number(deal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
          : undefined,
        date: deal.createdAt.toISOString(),
        author: assignedUser?.name || 'Sistema',
        authorAvatar: assignedUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        metadata: {
          dealId: deal.id,
          stage: deal.stage?.name,
          value: deal.value,
          status: deal.status,
        },
      });

      // Atualizações de estágio do deal
      if (deal.updatedAt.getTime() !== deal.createdAt.getTime()) {
        timeline.push({
          id: `deal-update-${deal.id}`,
          type: 'deal',
          title: `Negócio atualizado: ${deal.title}`,
          description: `Estágio: ${deal.stage?.name || 'N/A'}`,
          date: deal.updatedAt.toISOString(),
          author: assignedUser?.name || 'Sistema',
          metadata: {
            dealId: deal.id,
            stage: deal.stage?.name,
          },
        });
      }
    });

    // Adicionar atividades dos deals
    dealActivities.forEach(activity => {
      const typeMap: Record<string, TimelineEvent['type']> = {
        'NOTE': 'note',
        'CALL': 'call',
        'EMAIL': 'message',
        'MEETING': 'meeting',
        'STAGE_CHANGE': 'deal',
        'TASK': 'task',
        'WHATSAPP': 'whatsapp',
        'DEAL_CREATED': 'deal',
        'DEAL_CLOSED': 'deal',
      };

      timeline.push({
        id: `activity-${activity.id}`,
        type: typeMap[activity.type] || 'note',
        title: activity.description || 'Atividade registrada',
        description: activity.metadata ? JSON.stringify(activity.metadata) : undefined,
        date: activity.createdAt.toISOString(),
        author: 'Sistema',
        metadata: {
          activityId: activity.id,
          dealId: activity.dealId,
        },
      });
    });

    // Adicionar notas do contato (metadata.contactNotes)
    if (contactWithNotes?.metadata && typeof contactWithNotes.metadata === 'object') {
      const meta = contactWithNotes.metadata as Record<string, unknown>;
      if (Array.isArray(meta.contactNotes)) {
        (meta.contactNotes as Array<{ id: string; text: string; author: string; createdAt: string }>).forEach((note) => {
          timeline.push({
            id: `note-${note.id}`,
            type: 'note',
            title: note.text,
            description: undefined,
            date: note.createdAt,
            author: note.author || 'Agente',
            metadata: { noteId: note.id },
          });
        });
      }
    }

    // Criar mapa de conversas para canal
    const conversationMap = new Map(conversations.map(c => [c.id, c]));

    // Adicionar mensagens
    messages.forEach(message => {
      const conversation = conversationMap.get(message.conversationId);
      const isWhatsApp = true; // Assume WhatsApp por padrao
      
      timeline.push({
        id: `message-${message.id}`,
        type: isWhatsApp ? 'whatsapp' : 'message',
        title: isWhatsApp ? 'Mensagem WhatsApp' : 'Mensagem',
        description: message.content?.substring(0, 200) + (message.content && message.content.length > 200 ? '...' : '') || '[Sem conteúdo]',
        date: message.createdAt.toISOString(),
        author: message.direction === 'INBOUND' ? 'Cliente' : 'Agente',
        metadata: {
          messageId: message.id,
          conversationId: message.conversationId,
          direction: message.direction,
          status: message.status,
        },
      });
    });

    // Ordenar por data (mais recente primeiro)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limitar resultados
    const limitedTimeline = timeline.slice(0, limit);
    
    console.log('[Timeline API] Returning timeline with', limitedTimeline.length, 'events');

    return NextResponse.json({
      success: true,
      data: limitedTimeline,
      meta: {
        total: limitedTimeline.length,
        contactId: id,
        organizationId,
      },
    });
  } catch (error) {
    console.error("[Timeline API] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch contact timeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
