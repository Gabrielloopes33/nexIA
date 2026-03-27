/**
 * API de Importação de Contatos via CSV
 * POST: Recebe dados de contatos e salva no banco
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers';

interface ContactImportData {
  nome?: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  status?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    contact: ContactImportData;
    error: string;
  }>;
  duplicates: Array<{
    row: number;
    contact: ContactImportData;
  }>;
}

/**
 * POST /api/contatos/import
 * Importa múltiplos contatos a partir de dados CSV
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtém organizationId do token JWT (não aceita do cliente!)
    const organizationId = await getOrganizationId();
    
    const body = await request.json();
    const { contacts, importName, createTag, createList } = body;

    console.log('[Import Contacts] Iniciando importação:', { organizationId, count: contacts?.length });

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de contatos é obrigatória' },
        { status: 400 }
      );
    }

    // Limitar número de contatos por requisição
    if (contacts.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limite máximo de 1000 contatos por importação' },
        { status: 400 }
      );
    }

    // Usa o organizationId do usuário autenticado
    const orgId = organizationId;

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      duplicates: [],
    };

    const importedContactIds: string[] = [];

    const now = new Date().toISOString();

    // Processar cada contato
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i] as ContactImportData;
      const rowNumber = i + 1;

      try {
        // Validação: nome é obrigatório
        if (!contact.nome || contact.nome.trim() === '') {
          result.errors.push({
            row: rowNumber,
            contact,
            error: 'Nome é obrigatório',
          });
          continue;
        }

        // Validação: email deve ser válido (se fornecido)
        if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          result.errors.push({
            row: rowNumber,
            contact,
            error: 'Email inválido',
          });
          continue;
        }

        // Normalizar telefone
        const normalizedPhone = contact.telefone 
          ? contact.telefone.replace(/\D/g, '')
          : '';

        // Verificar se contato já existe (por telefone)
        if (normalizedPhone) {
          const existingContact = await prisma.contact.findFirst({
            where: { organizationId: orgId, phone: normalizedPhone },
            select: { id: true },
          });

          if (existingContact) {
            result.duplicates.push({
              row: rowNumber,
              contact,
            });
            continue;
          }
        }

        // Combinar nome e sobrenome
        const fullName = contact.sobrenome 
          ? `${contact.nome.trim()} ${contact.sobrenome.trim()}`
          : contact.nome.trim();

        // Mapear status
        let contactStatus: string = 'ACTIVE';
        if (contact.status) {
          const statusLower = contact.status.toLowerCase();
          if (statusLower === 'ativo' || statusLower === 'active') {
            contactStatus = 'ACTIVE';
          } else if (statusLower === 'inativo' || statusLower === 'inactive') {
            contactStatus = 'INACTIVE';
          } else if (statusLower === 'bloqueado' || statusLower === 'blocked') {
            contactStatus = 'BLOCKED';
          }
        }

        // Montar metadata com campos extras
        const metadata: Record<string, string> = {};
        if (contact.cidade) metadata.cidade = contact.cidade;
        if (contact.estado) metadata.estado = contact.estado;
        if (contact.empresa) metadata.empresa = contact.empresa;
        if (contact.cargo) metadata.cargo = contact.cargo;

        // Inserir contato
        const createdContact = await prisma.contact.create({
          data: {
            organizationId: orgId,
            phone: normalizedPhone || `sem-telefone-${Date.now()}-${i}`,
            name: fullName,
            metadata: Object.keys(metadata).length > 0 ? metadata : {},
            tags: [],
            status: contactStatus as 'ACTIVE' | 'INACTIVE' | 'BLOCKED',
            leadScore: 0,
            lastInteractionAt: new Date(now),
          },
        });

        importedContactIds.push(createdContact.id);
        result.imported++;
      } catch (error: any) {
        console.error('[Import Contacts] Erro ao processar contato:', error);
        result.errors.push({
          row: rowNumber,
          contact,
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    // Criar tag e/ou lista se solicitado e houver contatos importados
    if (importedContactIds.length > 0 && importName) {
      if (createTag) {
        try {
          // Upsert: cria ou reutiliza tag com esse nome
          const tag = await prisma.tag.upsert({
            where: { organizationId_name: { organizationId: orgId, name: importName } },
            update: {},
            create: {
              organizationId: orgId,
              name: importName,
              color: '#46347F',
              source: 'import',
            },
          });

          await prisma.contactTag.createMany({
            data: importedContactIds.map(contactId => ({
              contactId,
              tagId: tag.id,
            })),
            skipDuplicates: true,
          });
        } catch (tagError) {
          console.error('[Import Contacts] Erro ao criar tag:', tagError);
        }
      }

      if (createList) {
        try {
          const list = await prisma.list.create({
            data: {
              organizationId: orgId,
              name: importName,
              description: `Importação: ${importName}`,
              isDynamic: false,
              contactCount: importedContactIds.length,
            },
          });

          await prisma.listContact.createMany({
            data: importedContactIds.map(contactId => ({
              listId: list.id,
              contactId,
            })),
            skipDuplicates: true,
          });
        } catch (listError) {
          console.error('[Import Contacts] Erro ao criar lista:', listError);
        }
      }
    }

    console.log('[Import Contacts] Resultado:', {
      imported: result.imported,
      errors: result.errors.length,
      duplicates: result.duplicates.length,
    });

    return NextResponse.json({
      success: result.errors.length === 0 || result.imported > 0,
      data: result,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Import Contacts] Erro geral:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Falha na importação', details: error.message },
      { status: 500 }
    );
  }
}
