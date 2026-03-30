/**
 * @swagger
 * tags:
 *   - name: Contacts
 *     description: Gerenciamento de contatos
 * 
 * /api/contacts:
 *   get:
 *     summary: Lista todos os contatos
 *     description: Retorna todos os contatos da organização com filtros, busca e paginação
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED]
 *         description: Filtrar por status do contato
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou telefone (case insensitive)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filtrar por tags (separadas por vírgula, ex: tag1,tag2)
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir contatos deletados (soft delete)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de registros por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de contatos retornada com sucesso
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
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 *   
 *   post:
 *     summary: Cria um novo contato
 *     description: Cria um novo contato na organização do usuário autenticado
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do contato
 *               email:
 *                 type: string
 *                 description: Email do contato
 *               phone:
 *                 type: string
 *                 description: Telefone do contato (obrigatório)
 *               avatarUrl:
 *                 type: string
 *                 description: URL da foto do contato
 *               notes:
 *                 type: string
 *                 description: Notas sobre o contato
 *               metadata:
 *                 type: object
 *                 description: Metadados adicionais do contato
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags do contato (array de strings)
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLOCKED]
 *                 default: ACTIVE
 *               source:
 *                 type: string
 *                 description: Origem do contato
 *     responses:
 *       201:
 *         description: Contato criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Dados inválidos (telefone obrigatório)
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Usuário sem organização
 *       409:
 *         description: Contato com este telefone já existe
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLS } from '@/lib/db/rls';
import { 
  getOrganizationId, 
  getAuthenticatedUser,
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | null;
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query com Prisma
    const where: any = {
      organizationId,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags?.length) {
      where.tags = { hasSome: tags };
    }

    // Executa com contexto RLS para isolamento multi-tenant
    const [contacts, total] = await withRLS(prisma, organizationId, async (tx) => {
      return Promise.all([
        tx.contact.findMany({
          where,
          orderBy: { lastInteractionAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        tx.contact.count({ where }),
      ]);
    });

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

    // Busca contato pelo telefone (ativo ou soft-deleted) - com RLS
    const existingContact = await withRLS(prisma, organizationId, async (tx) => {
      return tx.contact.findFirst({
        where: {
          organizationId,
          phone: normalizedPhone,
        },
      });
    });

    // Monta metadata
    const contactMetadata: Record<string, any> = metadata || {};
    if (email) contactMetadata.email = email;
    if (notes) contactMetadata.notes = notes;
    if (source) contactMetadata.source = source;

    // Se existir e estiver deletado, restaura - com RLS
    if (existingContact?.deletedAt) {
      const restored = await withRLS(prisma, organizationId, async (tx) => {
        return tx.contact.update({
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

    // Cria novo contato - com RLS
    const contact = await withRLS(prisma, organizationId, async (tx) => {
      return tx.contact.create({
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
