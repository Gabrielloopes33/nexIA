/**
 * Row Level Security (RLS) Helper
 * 
 * Este módulo fornece funções para executar queries do Prisma
 * com o contexto de organização necessário para as políticas RLS.
 * 
 * @example
 * ```typescript
 * // Em um endpoint API
 * export const GET = withOrganizationAuth(async (req, user, orgId) => {
 *   const contacts = await withRLS(prisma, orgId, async (tx) => {
 *     return tx.contact.findMany({
 *       where: { organizationId: orgId },
 *       // ... outras opções
 *     });
 *   });
 *   
 *   return NextResponse.json({ data: contacts });
 * });
 * ```
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Estende o tipo PrismaClient para incluir transações
 type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Executa uma operação do Prisma com o contexto RLS configurado.
 * 
 * O RLS (Row Level Security) do PostgreSQL requer que o `organization_id`
 * esteja configurado na sessão do banco. Esta função usa uma transação
 * para garantir que o contexto seja setado antes da query e limpo depois.
 * 
 * @param prisma - Instância do PrismaClient
 * @param organizationId - ID da organização do usuário atual
 * @param operation - Função que executa as queries dentro do contexto RLS
 * @returns Resultado da operação
 * 
 * @example
 * ```typescript
 * const result = await withRLS(prisma, 'org-123', async (tx) => {
 *   // Todas as queries aqui usam o contexto RLS
 *   return tx.contact.findMany({
 *     where: { status: 'ACTIVE' }
 *     // O RLS já filtra por organization_id automaticamente!
 *   });
 * });
 * ```
 */
export async function withRLS<T>(
  prisma: PrismaClient,
  organizationId: string,
  operation: (tx: PrismaTransaction) => Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  const timeout = options?.timeout || 30000; // Default 30s (era 5s)
  
  return prisma.$transaction(async (tx) => {
    // Configura o organization_id na sessão do PostgreSQL
    // O RLS usará este valor nas políticas de segurança
    // Importante: o banco espera formato UUID ou TEXT compatível
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${organizationId}'`
    );
    
    try {
      // Executa a operação do usuário
      const result = await operation(tx as unknown as PrismaTransaction);
      return result;
    } finally {
      // Opcional: limpar o setting (geralmente não necessário pois SET LOCAL é por transação)
      // await tx.$executeRawUnsafe('RESET app.current_org_id');
    }
  }, {
    maxWait: timeout,
    timeout: timeout,
  });
}

/**
 * Versão para operações que não retornam valor (side effects)
 */
export async function withRLSVoid(
  prisma: PrismaClient,
  organizationId: string,
  operation: (tx: PrismaTransaction) => Promise<void>
): Promise<void> {
  await withRLS(prisma, organizationId, operation);
}

/**
 * Wrapper para múltiplas operações em batch
 * 
 * @example
 * ```typescript
 * const [contacts, deals] = await withRLSBatch(prisma, orgId, async (tx) => {
 *   const contactsPromise = tx.contact.findMany();
 *   const dealsPromise = tx.deal.findMany();
 *   return Promise.all([contactsPromise, dealsPromise]);
 * });
 * ```
 */
export async function withRLSBatch<T extends any[]>(
  prisma: PrismaClient,
  organizationId: string,
  operation: (tx: PrismaTransaction) => Promise<T>
): Promise<T> {
  return withRLS(prisma, organizationId, operation);
}

/**
 * Verifica se o RLS está ativo para uma tabela específica
 * 
 * NOTA: Esta função deve ser usada apenas em ambientes de desenvolvimento/teste
 * pois faz uma query adicional ao banco.
 */
export async function isRLSEnabled(
  prisma: PrismaClient,
  tableName: string
): Promise<boolean> {
  const result = await prisma.$queryRaw<{ relrowsecurity: boolean }[]>`
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = ${tableName} 
    AND relnamespace = 'public'::regnamespace
  `;
  
  return result[0]?.relrowsecurity ?? false;
}

/**
 * Lista todas as políticas RLS de uma tabela
 * 
 * NOTA: Apenas para debugging em desenvolvimento
 */
export async function listRLSPolicies(
  prisma: PrismaClient,
  tableName?: string
): Promise<Array<{
  tablename: string;
  policyname: string;
  cmd: string;
}>> {
  const query = tableName
    ? Prisma.sql`SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = ${tableName}`
    : Prisma.sql`SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public'`;
  
  return prisma.$queryRaw(query);
}
