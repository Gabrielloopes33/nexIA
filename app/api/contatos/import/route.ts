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
  utmsource?: string;
  utmmedium?: string;
  utmcampaign?: string;
  utmcontent?: string;
  utmterm?: string;
  facebook?: string;
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
    if (contacts.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Limite máximo de 5000 contatos por importação' },
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

    const now = new Date();

    // Validar todos os contatos e coletar telefones com número de linha
    interface ValidContact {
      rowNumber: number;
      contact: ContactImportData;
      normalizedPhone: string;
      fullName: string;
      contactStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
      metadata: Record<string, string>;
    }
    const validContacts: ValidContact[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i] as ContactImportData;
      const rowNumber = i + 1;

      if (!contact.nome || contact.nome.trim() === '') {
        result.errors.push({ row: rowNumber, contact, error: 'Nome é obrigatório' });
        continue;
      }

      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        result.errors.push({ row: rowNumber, contact, error: 'Email inválido' });
        continue;
      }

      const normalizedPhone = contact.telefone ? contact.telefone.replace(/\D/g, '') : '';

      const fullName = contact.sobrenome
        ? `${contact.nome.trim()} ${contact.sobrenome.trim()}`
        : contact.nome.trim();

      let contactStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' = 'ACTIVE';
      if (contact.status) {
        const s = contact.status.toLowerCase();
        if (s === 'inativo' || s === 'inactive') contactStatus = 'INACTIVE';
        else if (s === 'bloqueado' || s === 'blocked') contactStatus = 'BLOCKED';
      }

      const metadata: Record<string, string> = {};
      if (contact.cidade) metadata.cidade = contact.cidade;
      if (contact.estado) metadata.estado = contact.estado;
      if (contact.empresa) metadata.empresa = contact.empresa;
      if (contact.cargo) metadata.cargo = contact.cargo;
      if (contact.utmsource) metadata.utmsource = contact.utmsource;
      if (contact.utmmedium) metadata.utmmedium = contact.utmmedium;
      if (contact.utmcampaign) metadata.utmcampaign = contact.utmcampaign;
      if (contact.utmcontent) metadata.utmcontent = contact.utmcontent;
      if (contact.utmterm) metadata.utmterm = contact.utmterm;
      if (contact.facebook) metadata.facebook = contact.facebook;

      validContacts.push({ rowNumber, contact, normalizedPhone, fullName, contactStatus, metadata });
    }

    // Buscar todos os telefones existentes em uma única query
    const phonesToCheck = validContacts
      .map(v => v.normalizedPhone)
      .filter(p => p.length > 0);

    const existingPhones = new Set<string>();
    if (phonesToCheck.length > 0) {
      const existing = await prisma.contact.findMany({
        where: { organizationId: orgId, phone: { in: phonesToCheck } },
        select: { phone: true },
      });
      existing.forEach(c => existingPhones.add(c.phone));
    }

    // Separar duplicatas dos novos contatos
    const toCreate: typeof validContacts = [];
    for (const v of validContacts) {
      if (v.normalizedPhone && existingPhones.has(v.normalizedPhone)) {
        result.duplicates.push({ row: v.rowNumber, contact: v.contact });
      } else {
        toCreate.push(v);
      }
    }

    // Inserir todos de uma vez com createMany
    if (toCreate.length > 0) {
      await prisma.contact.createMany({
        data: toCreate.map((v, i) => ({
          organizationId: orgId,
          phone: v.normalizedPhone || `sem-telefone-${now.getTime()}-${i}`,
          name: v.fullName,
          metadata: Object.keys(v.metadata).length > 0 ? v.metadata : {},
          tags: [],
          status: v.contactStatus,
          leadScore: 0,
          lastInteractionAt: now,
        })),
        skipDuplicates: true,
      });
      result.imported = toCreate.length;
    }

    // Buscar IDs dos contatos criados para tags/listas
    const createdPhones = toCreate.map(v => v.normalizedPhone).filter(p => p.length > 0);
    const importedContactIds: string[] = [];
    if (createdPhones.length > 0) {
      const created = await prisma.contact.findMany({
        where: { organizationId: orgId, phone: { in: createdPhones } },
        select: { id: true },
      });
      importedContactIds.push(...created.map(c => c.id));
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
