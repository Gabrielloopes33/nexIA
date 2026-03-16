/**
 * AI Insights API
 * GET: Listar insights de IA
 * POST: Criar novo insight (para automações)
 * PATCH: Atualizar status do insight
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// GET /api/ai-insights?type=&status=&limit=20
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') as any;
    const status = searchParams.get('status') as any || 'ACTIVE';
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organization.id,
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;

    const [insights, total] = await Promise.all([
      prisma.aiInsight.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aiInsight.count({ where }),
    ]);

    // Agrupar por tipo para o frontend
    const grouped = insights.reduce((acc, insight) => {
      const key = insight.type.toLowerCase() + 's';
      if (!acc[key]) acc[key] = [];
      acc[key].push(insight);
      return acc;
    }, {} as Record<string, typeof insights>);

    return NextResponse.json({
      success: true,
      data: insights,
      grouped,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('AI Insights GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

// POST /api/ai-insights - Criar insight (usado por automações)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      type,
      category,
      title,
      description,
      value,
      confidence,
      metadata,
      relatedContactIds,
      relatedDealIds,
      action,
      actionUrl,
      expiresAt,
    } = body;

    // Validações
    if (!type || !category || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, category, title, description' },
        { status: 400 }
      );
    }

    const insight = await prisma.aiInsight.create({
      data: {
        organizationId: user.organization.id,
        type,
        category,
        title,
        description,
        value,
        confidence,
        metadata,
        relatedContactIds: relatedContactIds || [],
        relatedDealIds: relatedDealIds || [],
        action,
        actionUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: insight,
    }, { status: 201 });
  } catch (error) {
    console.error('AI Insights POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create insight' },
      { status: 500 }
    );
  }
}
