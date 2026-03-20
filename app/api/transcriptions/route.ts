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
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const conversationId = searchParams.get('conversationId');
    const status = searchParams.get('status') as any;
    const source = searchParams.get('source') as any;
    const converted = searchParams.get('converted');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organizationId,
    };

    if (contactId) where.contactId = contactId;
    if (conversationId) where.conversationId = conversationId;
    if (status) where.status = status;
    if (source) where.source = source;
    if (converted !== null) where.converted = converted === 'true';

    const [transcriptions, total] = await Promise.all([
      prisma.transcription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transcription.count({ where }),
    ]);
    
    // Buscar contatos em batch
    const contactIds = transcriptions.map(t => t.contactId).filter(Boolean) as string[];
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, name: true, phone: true, avatarUrl: true },
    });
    
    const contactMap = new Map(contacts.map(c => [c.id, c]));
    
    const transcriptionsWithContacts = transcriptions.map(t => ({
      ...t,
      contact: t.contactId ? contactMap.get(t.contactId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: transcriptionsWithContacts,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + transcriptions.length < total,
      },
    });
  } catch (error: any) {
    console.error('Transcriptions GET Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcriptions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transcriptions - Criar transcrição
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
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
        organizationId: user.organizationId,
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
    });
    
    // Buscar contato se houver
    let contact = null;
    if (contactId) {
      contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, phone: true, avatarUrl: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...transcription, contact },
    }, { status: 201 });
  } catch (error) {
    console.error('Transcriptions POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transcription' },
      { status: 500 }
    );
  }
}
