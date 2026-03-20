/**
 * Scheduling Queue API
 * GET: Listar leads na fila de agendamento
 * POST: Adicionar lead à fila
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { QueueStatus } from '@prisma/client';

// GET /api/schedules/queue
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as QueueStatus | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organization.id,
    };

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.schedulingQueue.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.schedulingQueue.count({ where }),
    ]);
    
    // Buscar contatos em batch
    const contactIds = items.map(i => i.contactId).filter(Boolean);
    const userIds = items.map(i => i.assignedTo).filter(Boolean);
    
    const [contacts, users] = await Promise.all([
      prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, name: true, phone: true, avatarUrl: true, tags: true, metadata: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
    ]);
    
    const contactMap = new Map(contacts.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const itemsWithRelations = items.map(item => ({
      ...item,
      contact: contactMap.get(item.contactId) || null,
      assignedUser: item.assignedTo ? userMap.get(item.assignedTo) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: itemsWithRelations,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    console.error('Queue GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

// POST /api/schedules/queue
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;
    
    const body = await request.json();
    const {
      contactId,
      tagId,
      source = 'manual',
      priority = 0,
      notes,
      assignedTo,
    } = body;

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Verifica se o contato já está na fila
    const existing = await prisma.schedulingQueue.findFirst({
      where: {
        organizationId: user.organization.id,
        contactId,
        status: { in: ['WAITING', 'IN_PROGRESS'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Contact is already in queue' },
        { status: 409 }
      );
    }

    const item = await prisma.schedulingQueue.create({
      data: {
        organizationId: user.organization.id,
        contactId,
        tagId,
        source,
        priority,
        notes,
        assignedTo,
        status: 'WAITING',
      },
    });
    
    // Buscar contato e usuário
    const [contact, assignedUser] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, phone: true, avatarUrl: true, tags: true, metadata: true },
      }),
      assignedTo ? prisma.user.findUnique({
        where: { id: assignedTo },
        select: { id: true, name: true, email: true },
      }) : null,
    ]);

    return NextResponse.json({
      success: true,
      data: { ...item, contact, assignedUser },
    }, { status: 201 });
  } catch (error) {
    console.error('Queue POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to queue' },
      { status: 500 }
    );
  }
}
