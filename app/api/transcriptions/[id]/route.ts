/**
 * Transcription Individual API
 * GET: Detalhes da transcrição
 * PATCH: Atualizar transcrição (análise, status)
 * DELETE: Remover transcrição
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/transcriptions/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const transcription = await prisma.transcription.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
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
        conversation: {
          select: {
            id: true,
            status: true,
            lastMessageAt: true,
          },
        },
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { success: false, error: 'Transcription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transcription,
    });
  } catch (error) {
    console.error('Transcription GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcription' },
      { status: 500 }
    );
  }
}

// PATCH /api/transcriptions/[id] - Atualizar transcrição
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Verifica se existe
    const existing = await prisma.transcription.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transcription not found' },
        { status: 404 }
      );
    }

    const {
      transcript,
      summary,
      status,
      sentiment,
      sentimentScore,
      objections,
      keyTopics,
      actionItems,
      converted,
      resolutionDays,
    } = body;

    const updateData: any = {};
    if (transcript !== undefined) updateData.transcript = transcript;
    if (summary !== undefined) updateData.summary = summary;
    if (status) updateData.status = status;
    if (sentiment) updateData.sentiment = sentiment;
    if (sentimentScore !== undefined) updateData.sentimentScore = sentimentScore;
    if (objections) updateData.objections = objections;
    if (keyTopics) updateData.keyTopics = keyTopics;
    if (actionItems) updateData.actionItems = actionItems;
    if (converted !== undefined) updateData.converted = converted;
    if (resolutionDays !== undefined) updateData.resolutionDays = resolutionDays;

    // Se completou a transcrição
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.processedAt = new Date();
    }

    const transcription = await prisma.transcription.update({
      where: { id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transcription,
    });
  } catch (error) {
    console.error('Transcription PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transcription' },
      { status: 500 }
    );
  }
}

// DELETE /api/transcriptions/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verifica se existe
    const existing = await prisma.transcription.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Transcription not found' },
        { status: 404 }
      );
    }

    await prisma.transcription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Transcription deleted successfully',
    });
  } catch (error) {
    console.error('Transcription DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transcription' },
      { status: 500 }
    );
  }
}
