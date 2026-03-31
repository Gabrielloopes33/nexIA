import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type RowData = Record<string, unknown>;

interface CliOptions {
  filePath: string;
  organizationId?: string;
  organizationSlug?: string;
  phoneColumn?: string;
  dryRun: boolean;
  overwrite: boolean;
  namespace?: string;
  flat: boolean;
}

const CANDIDATE_PHONE_COLUMNS = [
  'telefone',
  'phone',
  'celular',
  'whatsapp',
  'phone_number',
  'numero',
  'número',
];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    filePath: '',
    dryRun: false,
    overwrite: false,
    flat: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--file' && next) {
      options.filePath = next;
      i++;
      continue;
    }

    if (arg === '--organization-id' && next) {
      options.organizationId = next;
      i++;
      continue;
    }

    if (arg === '--organization-slug' && next) {
      options.organizationSlug = next;
      i++;
      continue;
    }

    if (arg === '--phone-column' && next) {
      options.phoneColumn = next;
      i++;
      continue;
    }

    if (arg === '--namespace' && next) {
      options.namespace = next;
      i++;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--overwrite') {
      options.overwrite = true;
      continue;
    }

    if (arg === '--flat') {
      options.flat = true;
      continue;
    }
  }

  if (!options.filePath) {
    throw new Error('Argumento obrigatório ausente: --file <caminho-do-arquivo>');
  }

  if (!options.organizationId && !options.organizationSlug) {
    throw new Error('Informe --organization-id <uuid> ou --organization-slug <slug>');
  }

  return options;
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function normalizePhone(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
}

function isNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function toRowObject(raw: RowData): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    const normalized = normalizeKey(key);
    if (!normalized) continue;
    if (!isNonEmptyValue(value)) continue;
    out[normalized] = String(value).trim();
  }

  return out;
}

function detectPhoneColumn(rows: Record<string, string>[], explicit?: string): string {
  if (explicit) {
    const normalized = normalizeKey(explicit);
    return normalized;
  }

  const firstRow = rows.find(row => Object.keys(row).length > 0);
  if (!firstRow) {
    throw new Error('Arquivo sem dados válidos para detectar colunas');
  }

  const keys = new Set(Object.keys(firstRow));
  for (const candidate of CANDIDATE_PHONE_COLUMNS) {
    const normalized = normalizeKey(candidate);
    if (keys.has(normalized)) {
      return normalized;
    }
  }

  throw new Error(
    'Não foi possível detectar a coluna de telefone. Use --phone-column com o nome exato da coluna.'
  );
}

function asJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

async function resolveOrganizationId(options: CliOptions): Promise<string> {
  if (options.organizationId) return options.organizationId;

  const organization = await prisma.organization.findUnique({
    where: { slug: options.organizationSlug },
    select: { id: true },
  });

  if (!organization) {
    throw new Error(`Organização não encontrada para slug: ${options.organizationSlug}`);
  }

  return organization.id;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const absoluteFilePath = path.resolve(options.filePath);

  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`Arquivo não encontrado: ${absoluteFilePath}`);
  }

  const organizationId = await resolveOrganizationId(options);
  const workbook = XLSX.readFile(absoluteFilePath, { raw: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Arquivo sem planilhas/abas');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<RowData>(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Arquivo sem linhas de dados');
  }

  const rows = rawRows.map(toRowObject);
  const phoneColumn = detectPhoneColumn(rows, options.phoneColumn);
  const dataRows: Array<{ rowNumber: number; phone: string; payload: Record<string, string> }> = [];

  rows.forEach((row, idx) => {
    const phone = normalizePhone(row[phoneColumn]);
    if (!phone) return;

    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === phoneColumn) continue;
      if (!isNonEmptyValue(value)) continue;
      payload[key] = value;
    }

    if (Object.keys(payload).length === 0) return;
    dataRows.push({ rowNumber: idx + 2, phone, payload });
  });

  if (dataRows.length === 0) {
    throw new Error('Nenhuma linha válida com telefone + dados para enriquecer');
  }

  const phones = Array.from(new Set(dataRows.map(row => row.phone)));
  const contacts = await prisma.contact.findMany({
    where: {
      organizationId,
      phone: { in: phones },
      deletedAt: null,
    },
    select: {
      id: true,
      phone: true,
      metadata: true,
      name: true,
    },
  });

  const contactByPhone = new Map(contacts.map(contact => [contact.phone, contact]));

  let matchedRows = 0;
  let updatedContacts = 0;
  let missingContacts = 0;
  let skippedNoChange = 0;

  const updates = new Map<string, Prisma.JsonObject>();

  for (const row of dataRows) {
    const contact = contactByPhone.get(row.phone);
    if (!contact) {
      missingContacts++;
      continue;
    }

    matchedRows++;

    const baseMetadata = asJsonObject(contact.metadata);
    let nextMetadata: Record<string, unknown> = baseMetadata;

    if (options.flat) {
      nextMetadata = { ...baseMetadata };
      for (const [key, value] of Object.entries(row.payload)) {
        if (!options.overwrite && isNonEmptyValue(nextMetadata[key])) continue;
        nextMetadata[key] = value;
      }
    } else {
      const namespace = options.namespace || 'typebot';
      const existingNamespace =
        baseMetadata[namespace] && typeof baseMetadata[namespace] === 'object' && !Array.isArray(baseMetadata[namespace])
          ? ({ ...(baseMetadata[namespace] as Record<string, unknown>) } as Record<string, unknown>)
          : {};

      for (const [key, value] of Object.entries(row.payload)) {
        if (!options.overwrite && isNonEmptyValue(existingNamespace[key])) continue;
        existingNamespace[key] = value;
      }

      nextMetadata = {
        ...baseMetadata,
        [namespace]: existingNamespace,
      };
    }

    const previousJson = JSON.stringify(baseMetadata);
    const nextJson = JSON.stringify(nextMetadata);

    if (previousJson === nextJson) {
      skippedNoChange++;
      continue;
    }

    updates.set(contact.id, nextMetadata as Prisma.JsonObject);
  }

  if (!options.dryRun) {
    for (const [contactId, metadata] of Array.from(updates.entries())) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { metadata },
      });
      updatedContacts++;
    }
  } else {
    updatedContacts = updates.size;
  }

  console.log('========================================');
  console.log('[Typebot Enrichment] Resumo');
  console.log(`Organização: ${organizationId}`);
  console.log(`Arquivo: ${absoluteFilePath}`);
  console.log(`Linhas lidas: ${rawRows.length}`);
  console.log(`Linhas com payload válido: ${dataRows.length}`);
  console.log(`Linhas vinculadas a contatos: ${matchedRows}`);
  console.log(`Contatos sem correspondência por telefone: ${missingContacts}`);
  console.log(`Contatos atualizados: ${updatedContacts}`);
  console.log(`Contatos sem alteração efetiva: ${skippedNoChange}`);
  console.log(`Modo dry-run: ${options.dryRun ? 'SIM' : 'NAO'}`);
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('[Typebot Enrichment] Erro:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
