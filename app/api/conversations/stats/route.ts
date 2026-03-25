/**
 * Conversations Stats API
 * GET: Estatísticas de conversas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { searchParams } = new URL(request.url);

    const period = searchParams.get('period') || '7d';
    const startDate = new Date();
    
    // Calcular data de início
    const days = parseInt(period.replace('d', '')) || 7;
    startDate.setDate(startDate.getDate() - days);

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    const [
      totalCount,
      activeCount,
      messagesCount,
    ] = await Promise.all([
      // Total de conversas
      prisma.conversation.count({
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
      }),

      // Conversas ativas
      prisma.conversation.count({
        where: {
          organizationId,
          status: 'active',
        },
      }),

      // Total de mensagens (busca IDs das conversas primeiro)
      prisma.message.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        messages: messagesCount,
        period,
        startDate,
      },
    });
  } catch (error) {
    console.error('Conversations Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
