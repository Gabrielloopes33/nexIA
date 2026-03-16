/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Obtém um agendamento específico
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento encontrado
 *       404:
 *         description: Agendamento não encontrado
 *       500:
 *         description: Erro interno
 *   patch:
 *     summary: Atualiza um agendamento
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *     responses:
 *       200:
 *         description: Agendamento atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Agendamento não encontrado
 *       500:
 *         description: Erro interno
 *   delete:
 *     summary: Remove um agendamento
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Agendamento removido
 *       404:
 *         description: Agendamento não encontrado
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScheduleType, ScheduleStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/schedules/[id]
 * Get a specific schedule
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
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

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schedules/[id]
 * Update a schedule
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      title,
      description,
      contactId,
      dealId,
      assignedTo,
      startTime,
      endTime,
      location,
      status,
    } = body;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type && !Object.values(ScheduleType).includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${Object.values(ScheduleType).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(ScheduleStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${Object.values(ScheduleStatus).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startTime) {
      startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format for startTime' },
          { status: 400 }
        );
      }
    }

    if (endTime) {
      endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format for endTime' },
          { status: 400 }
        );
      }
    }

    // Use existing dates if not provided
    const finalStartDate = startDate || existingSchedule.startTime;
    const finalEndDate = endDate || existingSchedule.endTime;

    if (finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { success: false, error: 'endTime must be after startTime' },
        { status: 400 }
      );
    }

    // Handle completedAt when status changes to completed
    let completedAt = existingSchedule.completedAt;
    if (status === 'completed' && existingSchedule.status !== 'completed') {
      completedAt = new Date();
    } else if (status === 'pending' && existingSchedule.status === 'completed') {
      completedAt = null;
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        type: type || undefined,
        title: title?.trim() || undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        contactId: contactId !== undefined ? (contactId || null) : undefined,
        dealId: dealId !== undefined ? (dealId || null) : undefined,
        assignedTo: assignedTo !== undefined ? (assignedTo || null) : undefined,
        startTime: startDate || undefined,
        endTime: endDate || undefined,
        location: location !== undefined ? (location?.trim() || null) : undefined,
        status: status || undefined,
        completedAt,
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
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules/[id]
 * Delete a schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
