import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface ContactNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

function getNotesFromMetadata(metadata: unknown): ContactNote[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const m = metadata as Record<string, unknown>;
  if (!Array.isArray(m.contactNotes)) return [];
  return m.contactNotes as ContactNote[];
}

/**
 * GET /api/contacts/[id]/notes
 * Lista todas as notas do contato
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { organizationId: true, metadata: true },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (contact.organizationId !== organizationId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const notes = getNotesFromMetadata(contact.metadata);

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    if (error instanceof AuthError) return createAuthErrorResponse(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
  }
}

/**
 * POST /api/contacts/[id]/notes
 * Cria uma nova nota para o contato
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;
    const body = await request.json();
    const { text, author } = body;

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: 'Texto da nota é obrigatório' }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { organizationId: true, metadata: true },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (contact.organizationId !== organizationId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const existingNotes = getNotesFromMetadata(contact.metadata);

    const newNote: ContactNote = {
      id: crypto.randomUUID(),
      text: text.trim(),
      author: author?.trim() || 'Agente',
      createdAt: new Date().toISOString(),
    };

    const currentMetadata = (contact.metadata && typeof contact.metadata === 'object')
      ? (contact.metadata as Record<string, unknown>)
      : {};

    await prisma.contact.update({
      where: { id },
      data: {
        metadata: {
          ...currentMetadata,
          contactNotes: [...existingNotes, newNote],
        },
      },
    });

    return NextResponse.json({ success: true, data: newNote }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return createAuthErrorResponse(error);
    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
  }
}

/**
 * DELETE /api/contacts/[id]/notes
 * Remove uma nota pelo noteId (body: { noteId })
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;
    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'noteId é obrigatório' }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { organizationId: true, metadata: true },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (contact.organizationId !== organizationId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const existingNotes = getNotesFromMetadata(contact.metadata);
    const updatedNotes = existingNotes.filter((n) => n.id !== noteId);

    const currentMetadata = (contact.metadata && typeof contact.metadata === 'object')
      ? (contact.metadata as Record<string, unknown>)
      : {};

    await prisma.contact.update({
      where: { id },
      data: {
        metadata: {
          ...currentMetadata,
          contactNotes: updatedNotes,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return createAuthErrorResponse(error);
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
  }
}
