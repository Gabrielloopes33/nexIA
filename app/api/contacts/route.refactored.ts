/**
 * Contacts API Route (REFATORADO - Exemplo Fase 1)
 * 
 * Este é um exemplo de como o endpoint deve ficar após a refatoração.
 * Ele usa os novos helpers de autenticação e não aceita organizationId do cliente.
 * 
 * GET: List all contacts for the authenticated user's organization
 * POST: Create a new contact in the authenticated user's organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getOrganizationId, 
  getAuthenticatedUser,
  requireOrganizationMembership,
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';

/**
 * GET /api/contacts
 * Lista todos os contatos da organização do usuário autenticado
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtém organizationId do token JWT (não aceita do cliente!)
    const organizationId = await getOrganizationId();
    
    // Opcional: valida se usuário é membro ativo da organização
    await requireOrganizationMembership(organizationId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | null;
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query com Prisma
    const where = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { lastInteractionAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    });
  } catch (error) {
    console.error('[Contacts GET] Error:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Cria um novo contato na organização do usuário autenticado
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtém dados do usuário autenticado
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não possui organização' },
        { status: 403 }
      );
    }

    const organizationId = user.organizationId;

    // Valida membership
    await requireOrganizationMembership(organizationId);

    // Parse body (sem organizationId!)
    const body = await request.json();
    const { 
      name, 
      email,
      phone, 
      avatarUrl,
      notes,
      metadata,
      tags,
      status,
      source,
    } = body;

    console.log('[Contacts POST] Criando contato:', { organizationId, name, phone });

    // Validações
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Normaliza telefone
    const normalizedPhone = phone.replace(/\D/g, '');

    // Verifica se já existe contato com este telefone
    const existingContact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone: normalizedPhone,
      },
    });

    // Monta metadata
    const contactMetadata: Record<string, unknown> = metadata || {};
    if (email) contactMetadata.email = email;
    if (notes) contactMetadata.notes = notes;
    if (source) contactMetadata.source = source;

    // Se existir e estiver deletado, restaura
    if (existingContact?.deletedAt) {
      const restored = await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          name: name || existingContact.name,
          avatarUrl: avatarUrl || null,
          metadata: contactMetadata,
          tags: tags || [],
          status: status || 'ACTIVE',
          deletedAt: null,
          lastInteractionAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: restored }, { status: 201 });
    }

    // Se contato ativo já existe, retorna erro
    if (existingContact) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Já existe um contato com o telefone ${phone}${existingContact.name ? ` (${existingContact.name})` : ''}` 
        },
        { status: 409 }
      );
    }

    // Cria novo contato
    const contact = await prisma.contact.create({
      data: {
        organizationId,
        phone: normalizedPhone,
        name: name || null,
        avatarUrl: avatarUrl || null,
        metadata: contactMetadata,
        tags: tags || [],
        status: status || 'ACTIVE',
        leadScore: 0,
        lastInteractionAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: contact,
    }, { status: 201 });

  } catch (error) {
    console.error('[Contacts POST] Error:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
