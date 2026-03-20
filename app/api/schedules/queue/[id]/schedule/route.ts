/**
 * Schedule from Queue API
 * POST: Converte um item da fila em um agendamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// POST /api/schedules/queue/[id]/schedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;
    
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      title,
      description,
      startTime,
      endTime,
      location,
    } = body;

    // Validações
    if (!type || !title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, startTime, endTime' },
        { status: 400 }
      );
    }

    // Busca o item da fila
    const queueItem = await prisma.schedulingQueue.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!queueItem) {
      return NextResponse.json(
        { success: false, error: 'Queue item not found' },
        { status: 404 }
      );
    }

    // Cria o agendamento e atualiza a fila em uma transação
    const [schedule, updatedQueue] = await prisma.$transaction([
      prisma.schedule.create({
        data: {
          organizationId: user.organization.id,
          type,
          title,
          description,
          contactId: queueItem.contactId,
          assignedTo: queueItem.assignedTo || user.userId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location,
          status: 'pending',
        },
      }),
      prisma.schedulingQueue.update({
        where: { id },
        data: {
          status: 'SCHEDULED',
          scheduledAt: new Date(),
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        queueItem: updatedQueue,
      },
    });
  } catch (error) {
    console.error('Queue Schedule Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule from queue' },
      { status: 500 }
    );
  }
}
