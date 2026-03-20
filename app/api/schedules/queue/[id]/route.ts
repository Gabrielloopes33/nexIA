/**
 * Scheduling Queue Item API
 * PATCH: Atualizar item da fila
 * DELETE: Remover item da fila
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { QueueStatus } from '@prisma/client';

// PATCH /api/schedules/queue/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;
    
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      priority,
      notes,
      assignedTo,
    } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    // Se completou, marca a data
    if (status === 'COMPLETED' || status === 'SCHEDULED') {
      updateData.completedAt = new Date();
    }

    const item = await prisma.schedulingQueue.update({
      where: {
        id,
        organizationId: user.organization.id,
      },
      data: updateData,
    });
    
    // Buscar contato e usuário
    const [contact, assignedUser] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: item.contactId },
        select: { id: true, name: true, phone: true, avatarUrl: true, tags: true, metadata: true },
      }),
      item.assignedTo ? prisma.user.findUnique({
        where: { id: item.assignedTo },
        select: { id: true, name: true, email: true },
      }) : null,
    ]);

    return NextResponse.json({
      success: true,
      data: { ...item, contact, assignedUser },
    });
  } catch (error) {
    console.error('Queue PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update queue item' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/queue/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;
    
    const { id } = await params;

    await prisma.schedulingQueue.delete({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Queue DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete queue item' },
      { status: 500 }
    );
  }
}
