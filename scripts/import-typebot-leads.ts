#!/usr/bin/env tsx
/**
 * Script: import-typebot-leads.ts
 * Importa leads de um CSV do Typebot para o NexIA Chat.
 *
 * Uso:
 *   npx tsx scripts/import-typebot-leads.ts [--dry-run]
 *
 * Observação: se `csv-parse` não estiver instalado, o script usa `xlsx`
 * (já presente no projeto) para ler o CSV.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

// =============================================================================
// CONFIGURAÇÕES
// =============================================================================

const CSV_PATH = 'C:\\Users\\gmora\\Downloads\\typebot-pesquisa-nexia-nr01-2026-03-31.csv';
const ORGANIZATION_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6';
const AUTHOR_USER_ID = 'a4b68345-e6a8-4cab-b4ee-fe1636c24cf5';
const BATCH_SIZE = 10;

// =============================================================================
// TIPOS
// =============================================================================

type CsvRow = {
  submittedAt: string;
  nome: string;
  sobrenome: string;
  telefone: string;
  email: string;
  cargo: string;
  colaboradores: string;
  responsavel: string;
  estagio: string;
  preocupacao: string;
  afastamento: string;
  levantamento: string;
  decisao: string;
  problema: string;
  duvida: string;
};

type Lead = CsvRow & {
  normalizedPhone: string;
  parsedDate: Date;
  fullName: string;
};

type Stats = {
  totalProcessed: number;
  contactsCreated: number;
  contactsUpdated: number;
  messagesCreated: number;
  messagesSkipped: number;
  tagsApplied: number;
  errors: number;
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

function parseCliArgs(): { dryRun: boolean } {
  const dryRun = process.argv.includes('--dry-run');
  return { dryRun };
}

function normalizePhone(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';

  // Se já começa com 55 e tem 12-13 dígitos, manter
  if (digits.startsWith('55')) {
    if (digits.length >= 12 && digits.length <= 13) {
      return digits;
    }
    // Se começa com 55 mas tem tamanho estranho, continuar para outras regras
  }

  // Se tem 11 dígitos e o 3º é 9, ou tem 10 dígitos, adicionar 55
  if (digits.length === 11 && digits[2] === '9') {
    return `55${digits}`;
  }
  if (digits.length === 10) {
    return `55${digits}`;
  }

  // Se tem 12-13 dígitos e já começa com 55 (tratado acima), ou outros casos
  if (digits.length >= 10 && digits.length <= 13) {
    return digits;
  }

  return '';
}

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Exemplos: "31 de mar., 11:03" | "30 de mar., 22:58"
  const match = dateStr.trim().match(/^(\d{1,2})\s+de\s+([a-zA-ZçÇãÃõÕáÁéÉíÍóÓúÚ]+)\.?\s*,?\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthAbbr = match[2].toLowerCase().replace(/\./g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hour = parseInt(match[3], 10);
  const minute = parseInt(match[4], 10);

  const month = MONTH_MAP[monthAbbr];
  if (month === undefined || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return null;
  }

  // Assume ano 2026 (conforme nome do arquivo)
  const year = 2026;
  const date = new Date(Date.UTC(year, month, day, hour, minute));
  if (isNaN(date.getTime())) return null;
  return date;
}

function readCsvRows(filePath: string): Record<string, string>[] {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo não encontrado: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('CSV vazio ou sem abas');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: '',
  });

  if (rows.length < 2) {
    throw new Error('CSV não possui dados suficientes');
  }

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1).map(cells => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = String(cells[idx] ?? '').trim();
    });
    return obj;
  });

  return dataRows;
}

function buildSummary(lead: Lead): string {
  const lines: string[] = [
    '🤖 Lead respondeu pesquisa Typebot (NR-01)',
    '',
    `Nome: ${lead.fullName}`,
    `Telefone: ${lead.normalizedPhone}`,
  ];

  const add = (label: string, value: string) => {
    if (value && value.trim()) {
      lines.push(`${label}: ${value.trim()}`);
    }
  };

  add('Email', lead.email);
  add('Cargo', lead.cargo);
  add('Colaboradores', lead.colaboradores);
  add('Responsável', lead.responsavel);
  add('Estágio', lead.estagio);
  add('Preocupação', lead.preocupacao);
  add('Afastamento', lead.afastamento);
  add('Levantamento', lead.levantamento);
  add('Decisão', lead.decisao);
  add('Problema', lead.problema);
  add('Dúvida', lead.duvida);

  return lines.join('\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// PROCESSAMENTO
// =============================================================================

async function ensureTags(dryRun: boolean) {
  const tagNames = ['Typebot', 'Pesquisa NR-01'];
  const tags: { id: string; name: string }[] = [];

  for (const name of tagNames) {
    if (dryRun) {
      tags.push({ id: `dry-run-tag-${name}`, name });
      continue;
    }

    const tag = await prisma.tag.upsert({
      where: {
        organizationId_name: {
          organizationId: ORGANIZATION_ID,
          name,
        },
      },
      update: {},
      create: {
        organizationId: ORGANIZATION_ID,
        name,
        color: '#6366f1',
        source: 'manual',
      },
    });
    tags.push(tag);
  }

  return tags;
}

async function processLead(
  lead: Lead,
  tagIds: string[],
  dryRun: boolean,
  stats: Stats
): Promise<void> {
  const summary = buildSummary(lead);

  if (dryRun) {
    console.log(`[DRY-RUN] Processando: ${lead.fullName} (${lead.normalizedPhone})`);
    stats.totalProcessed++;
    // Simula criação de contato e mensagem
    stats.contactsCreated++;
    stats.messagesCreated++;
    stats.tagsApplied += tagIds.length;
    return;
  }

  await prisma.$transaction(async tx => {
    // 1) Upsert Contact
    const existingContact = await tx.contact.findUnique({
      where: {
        organizationId_phone: {
          organizationId: ORGANIZATION_ID,
          phone: lead.normalizedPhone,
        },
      },
    });

    const baseMetadata = (existingContact?.metadata as Record<string, unknown> | null) || {};
    const existingTypebot = (baseMetadata.typebot as Record<string, unknown> | null) || {};

    const newTypebotData = {
      ...existingTypebot,
      email: lead.email || existingTypebot.email || '',
      cargo: lead.cargo || existingTypebot.cargo || '',
      colaboradores: lead.colaboradores || existingTypebot.colaboradores || '',
      responsavel: lead.responsavel || existingTypebot.responsavel || '',
      estagio: lead.estagio || existingTypebot.estagio || '',
      preocupacao: lead.preocupacao || existingTypebot.preocupacao || '',
      afastamento: lead.afastamento || existingTypebot.afastamento || '',
      levantamento: lead.levantamento || existingTypebot.levantamento || '',
      decisao: lead.decisao || existingTypebot.decisao || '',
      problema: lead.problema || existingTypebot.problema || '',
      duvida: lead.duvida || existingTypebot.duvida || '',
      submittedAt: lead.submittedAt || existingTypebot.submittedAt || '',
    };

    const mergedMetadata = {
      ...baseMetadata,
      typebot: newTypebotData,
    };

    const contact = await tx.contact.upsert({
      where: {
        organizationId_phone: {
          organizationId: ORGANIZATION_ID,
          phone: lead.normalizedPhone,
        },
      },
      update: {
        name: lead.fullName,
        metadata: mergedMetadata as any,
        lastInteractionAt: lead.parsedDate,
        status: 'ACTIVE',
      },
      create: {
        organizationId: ORGANIZATION_ID,
        phone: lead.normalizedPhone,
        name: lead.fullName,
        metadata: mergedMetadata as any,
        lastInteractionAt: lead.parsedDate,
        status: 'ACTIVE',
      },
    });

    if (existingContact) {
      stats.contactsUpdated++;
    } else {
      stats.contactsCreated++;
    }

    // 2) Idempotência da Message (mesmo content em qualquer momento)
    const existingMessage = await tx.message.findFirst({
      where: {
        contactId: contact.id,
        content: summary,
      },
    });

    if (existingMessage) {
      stats.messagesSkipped++;
      return;
    }

    // 3) Buscar ou criar Conversation
    let conversation = await tx.conversation.findFirst({
      where: {
        organizationId: ORGANIZATION_ID,
        contactId: contact.id,
      },
    });

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          organizationId: ORGANIZATION_ID,
          contactId: contact.id,
          status: 'active',
        },
      });
    }

    // 4) Criar Message
    await tx.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        content: summary,
        direction: 'OUTBOUND',
        status: 'sent',
      },
    });
    stats.messagesCreated++;

    // 5) Aplicar Tags (ContactTag upsert)
    for (const tagId of tagIds) {
      await tx.contactTag.upsert({
        where: {
          contactId_tagId: {
            contactId: contact.id,
            tagId,
          },
        },
        update: {},
        create: {
          contactId: contact.id,
          tagId,
          assignedBy: AUTHOR_USER_ID,
        },
      });
      stats.tagsApplied++;
    }
  }, { timeout: 30000 });

  stats.totalProcessed++;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const { dryRun } = parseCliArgs();

  console.log('========================================');
  console.log('Importação Typebot Leads (NR-01)');
  console.log(`Organização: ${ORGANIZATION_ID}`);
  console.log(`Arquivo: ${CSV_PATH}`);
  console.log(`Dry-run: ${dryRun ? 'SIM' : 'NÃO'}`);
  console.log('========================================\n');

  // Pré-carregar contatos e mensagens existentes para otimizar
  console.log('Carregando contatos e mensagens existentes...');
  const existingContacts = await prisma.contact.findMany({
    where: { organizationId: ORGANIZATION_ID },
    select: { id: true, phone: true },
  });
  const contactMap = new Map(existingContacts.map(c => [c.phone, c]));

  const existingConversations = await prisma.conversation.findMany({
    where: { organizationId: ORGANIZATION_ID },
    select: { id: true },
  });
  const conversationIds = existingConversations.map(c => c.id);

  const existingMessages = conversationIds.length > 0
    ? await prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          content: { startsWith: '🤖 Lead respondeu pesquisa Typebot' },
        },
        select: { contactId: true },
      })
    : [];
  const messageContactIds = new Set(existingMessages.map(m => m.contactId));

  console.log(`Contatos existentes: ${contactMap.size}`);
  console.log(`Mensagens Typebot existentes: ${messageContactIds.size}\n`);

  const rawRows = readCsvRows(CSV_PATH);
  console.log(`Total de linhas lidas do CSV: ${rawRows.length}`);

  const leads: Lead[] = [];
  let skippedInvalidPhone = 0;
  let skippedInvalidDate = 0;

  for (const row of rawRows) {
    const phoneRaw = row['telefone'];
    const normalizedPhone = normalizePhone(phoneRaw);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      skippedInvalidPhone++;
      continue;
    }

    const parsedDate = parseBrazilianDate(row['Submitted at']);
    if (!parsedDate) {
      skippedInvalidDate++;
      continue;
    }

    const nome = (row['nome'] || '').trim();
    const sobrenome = (row['sobrenome'] || '').trim();
    const fullName = `${nome} ${sobrenome}`.trim();

    leads.push({
      submittedAt: row['Submitted at'] || '',
      nome,
      sobrenome,
      telefone: phoneRaw,
      email: row['email'] || '',
      cargo: row['cargo'] || '',
      colaboradores: row['colaboradores'] || '',
      responsavel: row['responsável'] || '',
      estagio: row['estágio'] || '',
      preocupacao: row['preocupação'] || '',
      afastamento: row['afastamento'] || '',
      levantamento: row['levantamento'] || '',
      decisao: row['decisão'] || '',
      problema: row['problema'] || '',
      duvida: row['dúvida'] || '',
      normalizedPhone,
      parsedDate,
      fullName,
    });
  }

  console.log(`Leads válidos (telefone + data): ${leads.length}`);
  console.log(`Ignorados (telefone inválido): ${skippedInvalidPhone}`);
  console.log(`Ignorados (data inválida): ${skippedInvalidDate}`);

  // Deduplicar por telefone normalizado (manter mais recente)
  const phoneToLead = new Map<string, Lead>();
  for (const lead of leads) {
    const existing = phoneToLead.get(lead.normalizedPhone);
    if (!existing || lead.parsedDate.getTime() > existing.parsedDate.getTime()) {
      phoneToLead.set(lead.normalizedPhone, lead);
    }
  }

  const uniqueLeads = Array.from(phoneToLead.values());
  console.log(`Leads únicos após deduplicação: ${uniqueLeads.length}\n`);

  // Garantir tags existem
  const tags = await ensureTags(dryRun);
  const tagIds = tags.map(t => t.id);
  console.log(`Tags preparadas: ${tags.map(t => t.name).join(', ')}\n`);

  const stats: Stats = {
    totalProcessed: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    messagesCreated: 0,
    messagesSkipped: 0,
    tagsApplied: 0,
    errors: 0,
  };

  // Processar em lotes
  for (let i = 0; i < uniqueLeads.length; i += BATCH_SIZE) {
    const batch = uniqueLeads.slice(i, i + BATCH_SIZE);
    console.log(`Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniqueLeads.length / BATCH_SIZE)} (${batch.length} leads)...`);

    for (const lead of batch) {
      const existingContact = contactMap.get(lead.normalizedPhone);
      if (existingContact && messageContactIds.has(existingContact.id)) {
        stats.messagesSkipped++;
        stats.totalProcessed++;
        continue;
      }
      try {
        await processLead(lead, tagIds, dryRun, stats);
      } catch (err) {
        stats.errors++;
        console.error(`[ERRO] Telefone ${lead.normalizedPhone} (${lead.fullName}):`, err instanceof Error ? err.message : err);
      }
    }

    // Pequena pausa entre lotes para não sobrecarregar o banco
    if (i + BATCH_SIZE < uniqueLeads.length) {
      await sleep(200);
    }
  }

  console.log('\n========================================');
  console.log('RESUMO DA IMPORTAÇÃO');
  console.log('========================================');
  console.log(`Total processado:     ${stats.totalProcessed}`);
  console.log(`Contatos criados:     ${stats.contactsCreated}`);
  console.log(`Contatos atualizados: ${stats.contactsUpdated}`);
  console.log(`Mensagens criadas:    ${stats.messagesCreated}`);
  console.log(`Mensagens puladas:    ${stats.messagesSkipped}`);
  console.log(`Tags aplicadas:       ${stats.tagsApplied}`);
  console.log(`Erros:                ${stats.errors}`);
  console.log(`Dry-run:              ${dryRun ? 'SIM' : 'NÃO'}`);
  console.log('========================================');
}

main()
  .catch(err => {
    console.error('Erro fatal:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
