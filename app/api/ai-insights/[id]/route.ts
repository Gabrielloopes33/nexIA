/**
 * AI Insight Individual API
 * GET: Detalhes do insight
 * PATCH: Atualizar status (dismiss, archive)
 * DELETE: Remover insight
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/ai-insights/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const insight = await prisma.aiInsight.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!insight) {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('AI Insight GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insight' },
      { status: 500 }
    );
  }
}

// PATCH /api/ai-insights/[id] - Atualizar status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { status, clickedAt } = body;

    // Verifica se existe
    const existing = await prisma.aiInsight.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'DISMISSED') {
        updateData.dismissedAt = new Date();
      }
    }
    if (clickedAt) {
      updateData.clickedAt = new Date(clickedAt);
    }

    const insight = await prisma.aiInsight.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('AI Insight PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-insights/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verifica se existe
    const existing = await prisma.aiInsight.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      );
    }

    await prisma.aiInsight.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Insight deleted successfully',
    });
  } catch (error) {
    console.error('AI Insight DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete insight' },
      { status: 500 }
    );
  }
}
