/**
 * Backfill específico da PERCI para criar produto NR1 e migrar tags NR1_*
 * Uso: npx tsx scripts/backfill-perci-nr1.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PERCI_ORG_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6'

async function main() {
  console.log('[Backfill PERCI NR1] Iniciando...')

  // 1. Cria produto NR1 (fora de transação longa)
  let nr1Product = await prisma.product.findFirst({
    where: { organizationId: PERCI_ORG_ID, name: 'NR1' },
  })

  if (!nr1Product) {
    nr1Product = await prisma.product.create({
      data: {
        organizationId: PERCI_ORG_ID,
        name: 'NR1',
        description: 'Negócio Reputacional 1 - migrado das tags NR1_*',
        color: '#f59e0b',
        status: 'ACTIVE',
      },
    })
    console.log(`[Backfill PERCI NR1] Produto criado: ${nr1Product.id}`)
  } else {
    console.log(`[Backfill PERCI NR1] Produto já existe: ${nr1Product.id}`)
  }

  // 2. Cria pipeline NR1
  let nr1Pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: PERCI_ORG_ID, productId: nr1Product.id },
  })

  if (!nr1Pipeline) {
    nr1Pipeline = await prisma.pipeline.create({
      data: {
        productId: nr1Product.id,
        organizationId: PERCI_ORG_ID,
        name: 'Pipeline NR1',
        isDefault: true,
        status: 'ACTIVE',
      },
    })
    console.log(`[Backfill PERCI NR1] Pipeline criado: ${nr1Pipeline.id}`)
  } else {
    console.log(`[Backfill PERCI NR1] Pipeline já existe: ${nr1Pipeline.id}`)
  }

  // 3. Migra tags NR1_ para o produto NR1 (uma por uma, sem transação longa)
  const nr1Tags = await prisma.tag.findMany({
    where: {
      organizationId: PERCI_ORG_ID,
      name: { startsWith: 'NR1_' },
    },
  })

  console.log(`[Backfill PERCI NR1] ${nr1Tags.length} tags NR1_ encontradas`)

  for (const tag of nr1Tags) {
    const newName = tag.name.replace(/^NR1_\s*/, '').trim()
    await prisma.tag.update({
      where: { id: tag.id },
      data: {
        productId: nr1Product.id,
        name: newName || tag.name,
      },
    })
    console.log(`[Backfill PERCI NR1] Tag "${tag.name}" -> "${newName}"`)
  }

  // 4. Migra deals que possuem tags NR1_* para o produto NR1
  const dealsWithNR1Tag = await prisma.deal.findMany({
    where: {
      organizationId: PERCI_ORG_ID,
      OR: nr1Tags.map((t) => ({
        tags: { has: t.name },
      })),
    },
  })

  console.log(`[Backfill PERCI NR1] ${dealsWithNR1Tag.length} deals com tag NR1 encontrados`)

  for (const deal of dealsWithNR1Tag) {
    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        productId: nr1Product.id,
        pipelineId: nr1Pipeline.id,
      },
    })
    console.log(`[Backfill PERCI NR1] Deal ${deal.id} migrado`)
  }

  // 5. Garante que stages restantes sem pipelineId vão para o pipeline NR1
  const stagesUpdated = await prisma.pipelineStage.updateMany({
    where: { organizationId: PERCI_ORG_ID, pipelineId: null },
    data: { pipelineId: nr1Pipeline.id },
  })
  console.log(`[Backfill PERCI NR1] ${stagesUpdated.count} stages atualizados`)

  // 6. Garante que deals restantes sem productId vão para NR1
  const dealsUpdated = await prisma.deal.updateMany({
    where: { organizationId: PERCI_ORG_ID, productId: null },
    data: { productId: nr1Product.id, pipelineId: nr1Pipeline.id },
  })
  console.log(`[Backfill PERCI NR1] ${dealsUpdated.count} deals restantes atualizados`)

  console.log('[Backfill PERCI NR1] Concluído com sucesso!')
}

main().catch((error) => {
  console.error('[Backfill PERCI NR1] Erro fatal:', error)
  process.exit(1)
}).finally(() => {
  prisma['$disconnect']().catch(() => {})
})
