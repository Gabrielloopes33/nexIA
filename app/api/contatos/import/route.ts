/**
 * API de Importação de Contatos via CSV
 * POST: Recebe dados de contatos e salva no banco
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

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
    const body = await request.json();
    const { organizationId, contacts } = body;

    console.log('[Import Contacts] Iniciando importação:', { organizationId, count: contacts?.length });

    // Validação dos campos obrigatórios
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID é obrigatório' },
        { status: 400 }
      );
    }

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

    // Busca organização válida
    let orgId = organizationId;
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      if (existingOrg) {
        orgId = existingOrg.id;
      }
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      duplicates: [],
    };

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
          const { data: existingContact, error: checkError } = await supabaseServer
            .from('contacts')
            .select('id')
            .eq('organization_id', orgId)
            .eq('phone', normalizedPhone)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('[Import Contacts] Erro ao verificar contato existente:', checkError);
          }

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
        const { error: insertError } = await supabaseServer
          .from('contacts')
          .insert({
            organization_id: orgId,
            phone: normalizedPhone || `sem-telefone-${Date.now()}-${i}`,
            name: fullName,
            email: contact.email || null,
            metadata: Object.keys(metadata).length > 0 ? metadata : {},
            tags: [],
            status: contactStatus,
            lead_score: 0,
            created_at: now,
            updated_at: now,
            last_interaction_at: now,
          });

        if (insertError) {
          console.error('[Import Contacts] Erro ao inserir contato:', insertError);
          result.errors.push({
            row: rowNumber,
            contact,
            error: `Erro ao salvar: ${insertError.message}`,
          });
          continue;
        }

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
    return NextResponse.json(
      { success: false, error: 'Falha na importação', details: error.message },
      { status: 500 }
    );
  }
}
