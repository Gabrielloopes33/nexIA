/**
 * Transcriptions API
 * GET: Listar transcrições
 * POST: Criar nova transcrição (upload ou processamento)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// GET /api/transcriptions?contactId=&status=&limit=20
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const conversationId = searchParams.get('conversationId');
    const status = searchParams.get('status') as any;
    const source = searchParams.get('source') as any;
    const converted = searchParams.get('converted');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organization.id,
    };

    if (contactId) where.contactId = contactId;
    if (conversationId) where.conversationId = conversationId;
    if (status) where.status = status;
    if (source) where.source = source;
    if (converted !== null) where.converted = converted === 'true';

    const [transcriptions, total] = await Promise.all([
      prisma.transcription.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transcription.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transcriptions,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Transcriptions GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcriptions' },
      { status: 500 }
    );
  }
}

// POST /api/transcriptions - Criar transcrição
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      contactId,
      conversationId,
      source,
      sourceId,
      title,
      duration,
      transcript,
      summary,
      audioUrl,
      audioSize,
      audioFormat,
      recordedAt,
    } = body;

    // Validações
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: source' },
        { status: 400 }
      );
    }

    const transcription = await prisma.transcription.create({
      data: {
        organizationId: user.organization.id,
        contactId,
        conversationId,
        source,
        sourceId,
        title,
        duration,
        transcript,
        summary,
        audioUrl,
        audioSize,
        audioFormat,
        recordedAt: recordedAt ? new Date(recordedAt) : null,
        status: transcript ? 'COMPLETED' : 'PENDING',
        processedAt: transcript ? new Date() : null,
      },
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
    }, { status: 201 });
  } catch (error) {
    console.error('Transcriptions POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transcription' },
      { status: 500 }
    );
  }
}
