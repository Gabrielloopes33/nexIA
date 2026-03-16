/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Lista todos os agendamentos da organização
 *     tags: [Schedules]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [meeting, task, call, deadline]
 *         description: Tipo de agendamento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Status do agendamento
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Cria um novo agendamento
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - type
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [meeting, task, call, deadline]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               contactId:
 *                 type: string
 *                 format: uuid
 *               dealId:
 *                 type: string
 *                 format: uuid
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScheduleType, ScheduleStatus } from '@prisma/client';

/**
 * GET /api/schedules
 * List all schedules for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type') as ScheduleType | null;
    const status = searchParams.get('status') as ScheduleStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { 
      organizationId,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        (where.startTime as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.startTime as Record<string, Date>).lte = new Date(endDate + 'T23:59:59');
      }
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        orderBy: { startTime: 'asc' },
        take: limit,
        skip: offset,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.schedule.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: schedules,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + schedules.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules
 * Create a new schedule
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      organizationId,
      type,
      title,
      description,
      contactId,
      dealId,
      assignedTo,
      startTime,
      endTime,
      location,
    } = body;

    // Validate required fields
    if (!organizationId || !type || !title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, type, title, startTime, endTime' },
        { status: 400 }
      );
    }

    // Validate type
    if (!Object.values(ScheduleType).includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${Object.values(ScheduleType).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format for startTime or endTime' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'endTime must be after startTime' },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        organizationId,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        contactId: contactId || null,
        dealId: dealId || null,
        assignedTo: assignedTo || null,
        startTime: startDate,
        endTime: endDate,
        location: location?.trim() || null,
        status: 'pending',
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
