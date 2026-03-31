#!/usr/bin/env tsx
/**
 * Script: backfill-conversations-by-tag.ts
 * Para os contatos que receberam o DISPARO NR-01 (status SENT):
 *   1. Aplica tag "NR1_Disparo Feito" (se ainda não têm)
 *   2. Cria conversa (se ainda não têm)
 *
 * Uso:
 *   npx tsx scripts/backfill-conversations-by-tag.ts           # produção
 *   npx tsx scripts/backfill-conversations-by-tag.ts --dry-run # apenas lista
 */

import { prisma } from '@/lib/prisma'

// === CONFIGURAÇÃO ===
const ORGANIZATION_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6'
const CAMPAIGN_ID = '883a1aec-6b39-4041-8ca1-41c029a39c28' // DISPARO NR-01
const TAG = 'NR1_Disparo Feito'
const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 50

async function main() {
  console.log(`\n=== Backfill: DISPARO NR-01 → Conversas + Tag ===`)
  console.log(`Campaign: ${CAMPAIGN_ID}`)
  console.log(`Tag:      "${TAG}"`)
  console.log(`Org:      ${ORGANIZATION_ID}`)
  console.log(`Modo:     ${DRY_RUN ? 'DRY RUN (nenhuma alteração)' : 'PRODUÇÃO'}`)
  console.log(`=================================================\n`)

  // 1. Todos os campaign_contacts com status SENT
  const sentContacts = await prisma.campaignContact.findMany({
    where: { campaignId: CAMPAIGN_ID, status: 'SENT' },
    select: { contactId: true, phone: true, name: true },
  })

  const contactIds = sentContacts.map(c => c.contactId)
  console.log(`Contatos com disparo enviado (SENT): ${sentContacts.length}`)

  if (contactIds.length === 0) {
    console.log('Nenhum contato encontrado. Encerrando.')
    return
  }

  // 2. Verifica quais contatos já têm a tag
  const contactsWithTag = await prisma.contact.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      id: { in: contactIds },
      tags: { has: TAG },
    },
    select: { id: true },
  })
  const contactIdsWithTag = new Set(contactsWithTag.map(c => c.id))
  const needsTag = contactIds.filter(id => !contactIdsWithTag.has(id))

  // 3. Verifica quais contatos já têm conversa
  const existingConversations = await prisma.conversation.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      contactId: { in: contactIds },
    },
    select: { contactId: true },
  })
  const contactIdsWithConversation = new Set(existingConversations.map(c => c.contactId))
  const needsConversation = contactIds.filter(id => !contactIdsWithConversation.has(id))

  console.log(`Já têm tag "${TAG}":   ${contactIdsWithTag.size}`)
  console.log(`Precisam de tag:         ${needsTag.length}`)
  console.log(`Já têm conversa:         ${contactIdsWithConversation.size}`)
  console.log(`Precisam de conversa:    ${needsConversation.length}`)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Nenhuma alteração feita. Resumo do que seria executado:')
    console.log(`  - Aplicar tag em ${needsTag.length} contatos`)
    console.log(`  - Criar ${needsConversation.length} conversas`)
    return
  }

  if (needsTag.length === 0 && needsConversation.length === 0) {
    console.log('\nTudo já está sincronizado. Nada a fazer.')
    return
  }

  let tagsApplied = 0
  let tagsFailed = 0
  let conversationsCreated = 0
  let conversationsFailed = 0

  // 4. Aplica a tag nos contatos que não têm
  if (needsTag.length > 0) {
    console.log(`\n→ Aplicando tag em ${needsTag.length} contatos...`)
    for (let i = 0; i < needsTag.length; i += BATCH_SIZE) {
      const batch = needsTag.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(id =>
          prisma.contact.update({
            where: { id },
            data: { tags: { push: TAG } },
          })
        )
      )
      for (const r of results) {
        if (r.status === 'fulfilled') tagsApplied++
        else { tagsFailed++; console.error(`  ERRO tag: ${(r as PromiseRejectedResult).reason}`) }
      }
    }
    console.log(`  Tags aplicadas: ${tagsApplied} | Falhas: ${tagsFailed}`)
  }

  // 5. Cria conversas para os contatos sem uma
  if (needsConversation.length > 0) {
    console.log(`\n→ Criando ${needsConversation.length} conversas...`)
    for (let i = 0; i < needsConversation.length; i += BATCH_SIZE) {
      const batch = needsConversation.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(contactId =>
          prisma.conversation.create({
            data: {
              organizationId: ORGANIZATION_ID,
              contactId,
              status: 'active',
            },
          })
        )
      )
      for (const r of results) {
        if (r.status === 'fulfilled') conversationsCreated++
        else { conversationsFailed++; console.error(`  ERRO conversa: ${(r as PromiseRejectedResult).reason}`) }
      }
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(needsConversation.length / BATCH_SIZE)
      console.log(`  Lote ${batchNum}/${totalBatches}: total criadas até agora: ${conversationsCreated}`)
    }
  }

  console.log(`\n=== Resultado Final ===`)
  console.log(`Tags aplicadas:     ${tagsApplied} (falhas: ${tagsFailed})`)
  console.log(`Conversas criadas:  ${conversationsCreated} (falhas: ${conversationsFailed})`)
  console.log(`Total conversas para contatos do disparo: ${contactIdsWithConversation.size + conversationsCreated}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
