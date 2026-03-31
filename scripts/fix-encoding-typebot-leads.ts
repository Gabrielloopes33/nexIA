#!/usr/bin/env tsx
/**
 * Script: fix-encoding-typebot-leads.ts
 * Corrige o encoding dos dados importados pelo import-typebot-leads.ts
 * que foram salvos com encoding errado (latin1 lido como UTF-8).
 *
 * Uso:
 *   npx tsx scripts/fix-encoding-typebot-leads.ts           # produção
 *   npx tsx scripts/fix-encoding-typebot-leads.ts --dry-run # apenas lista
 */

import { prisma } from '@/lib/prisma'

const ORGANIZATION_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6'
const DRY_RUN = process.argv.includes('--dry-run')

/**
 * Tenta corrigir uma string que foi lida como Latin-1 mas era UTF-8.
 * Se a string não tiver problemas de encoding, retorna ela mesma.
 */
function fixEncoding(text: string): string {
  try {
    const fixed = Buffer.from(text, 'latin1').toString('utf8')
    // Verifica se a string mudou e se a correção faz sentido
    // (Buffer.from(..., 'latin1') pode corromper strings já corretas com chars > 127)
    return fixed
  } catch {
    return text
  }
}

/**
 * Detecta se uma string provavelmente tem encoding errado.
 * Strings UTF-8 mal-lidas como Latin-1 produzem padrões como "Ã§", "Ã£", "Ã©", etc.
 */
function hasEncodingIssue(text: string): boolean {
  return /Ã[§£©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß]/.test(text) ||
         /Ã\u0083/.test(text)
}

function fixMetadata(metadata: unknown): { fixed: unknown; changed: boolean } {
  if (!metadata || typeof metadata !== 'object') return { fixed: metadata, changed: false }

  const obj = metadata as Record<string, unknown>
  let changed = false
  const result: Record<string, unknown> = { ...obj }

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string' && hasEncodingIssue(val)) {
      result[key] = fixEncoding(val)
      changed = true
    } else if (val && typeof val === 'object') {
      const { fixed, changed: inner } = fixMetadata(val)
      if (inner) {
        result[key] = fixed
        changed = true
      }
    }
  }

  return { fixed: result, changed }
}

async function main() {
  console.log(`\n=== Fix Encoding: Leads Typebot ===`)
  console.log(`Organização: ${ORGANIZATION_ID}`)
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN (nenhuma alteração)' : 'PRODUÇÃO'}`)
  console.log(`====================================\n`)

  // 1. Busca contatos com metadata typebot
  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      metadata: { not: undefined },
    },
    select: { id: true, name: true, metadata: true },
  })

  console.log(`Total de contatos com metadata: ${contacts.length}`)

  let contactsFixed = 0
  let messagesFixed = 0

  for (const contact of contacts) {
    const meta = contact.metadata as Record<string, unknown> | null
    if (!meta?.typebot) continue

    const nameNeedsfix = hasEncodingIssue(contact.name)
    const { fixed: fixedMeta, changed: metaChanged } = fixMetadata(meta)

    if (!nameNeedsfix && !metaChanged) continue

    if (DRY_RUN) {
      console.log(`[DRY RUN] Contato ${contact.id} (${contact.name}):`)
      if (nameNeedsfix) console.log(`  Nome: "${contact.name}" → "${fixEncoding(contact.name)}"`)
      if (metaChanged) {
        const tb = (meta.typebot as Record<string, string>) || {}
        const fixedTb = ((fixedMeta as Record<string, unknown>).typebot as Record<string, string>) || {}
        for (const k of Object.keys(tb)) {
          if (tb[k] !== fixedTb[k]) {
            console.log(`  ${k}: "${tb[k]}" → "${fixedTb[k]}"`)
          }
        }
      }
      contactsFixed++
      continue
    }

    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        ...(nameNeedsfix ? { name: fixEncoding(contact.name) } : {}),
        ...(metaChanged ? { metadata: fixedMeta as any } : {}),
      },
    })
    contactsFixed++
    process.stdout.write('.')
  }

  if (!DRY_RUN) console.log()

  // 2. Corrige mensagens do Typebot
  const messages = await prisma.message.findMany({
    where: {
      content: { contains: 'Lead respondeu pesquisa Typebot' },
    },
    select: { id: true, content: true },
  })

  console.log(`\nMensagens Typebot encontradas: ${messages.length}`)

  for (const msg of messages) {
    if (!hasEncodingIssue(msg.content)) continue

    if (DRY_RUN) {
      console.log(`[DRY RUN] Mensagem ${msg.id}: encoding incorreto detectado`)
      messagesFixed++
      continue
    }

    await prisma.message.update({
      where: { id: msg.id },
      data: { content: fixEncoding(msg.content) },
    })
    messagesFixed++
    process.stdout.write('.')
  }

  if (!DRY_RUN) console.log()

  console.log(`\n=== Resultado ===`)
  console.log(`Contatos corrigidos: ${contactsFixed}`)
  console.log(`Mensagens corrigidas: ${messagesFixed}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
