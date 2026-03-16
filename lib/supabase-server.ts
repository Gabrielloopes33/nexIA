/**
 * Cliente Supabase para Server-Side
 * Usa a API REST do Supabase (porta 8000) em vez de conexão direta PostgreSQL
 * Útil quando o Prisma não consegue conectar (ex: desenvolvimento local com Supabase remoto)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://49.13.228.89:8000'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY não definida. Algumas operações podem falhar.')
}

export const supabaseServer = createClient(
  supabaseUrl,
  serviceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Helper para verificar se o Prisma está disponível
 * Se não estiver, usa o Supabase Client
 */
export async function queryWithFallback<T>(
  prismaQuery: () => Promise<T>,
  supabaseQuery: () => Promise<T>
): Promise<T> {
  try {
    // Tenta usar Prisma primeiro
    return await prismaQuery()
  } catch (error: any) {
    // Se for erro de conexão, usa Supabase
    if (error?.message?.includes("Can't reach database server")) {
      console.log('Prisma indisponível, usando Supabase Client...')
      return await supabaseQuery()
    }
    throw error
  }
}
