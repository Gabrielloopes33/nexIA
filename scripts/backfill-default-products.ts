/**
 * Script de backfill para migration de Product/Pipeline.
 *
 * Este script:
 * 1. Para cada organização com stages sem pipelineId, cria um Produto Padrão
 *    e um Pipeline Principal, e associa os stages e deals existentes.
 * 2. Para a organização PERCI, cria o produto "NR1" e migra as tags NR1_*
 *    para ficarem vinculadas a esse produto.
 *
 * Uso:
 *   npx tsx scripts/backfill-default-products.ts
 *   # ou
 *   npx ts-node scripts/backfill-default-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ID da organização PERCI (descoberto via query)
const PERCI_ORG_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6'

async function backfillDefaultProducts() {
  console.log('[Backfill] Iniciando backfill de produtos e pipelines padrão...')

  // 1. Buscar todas as organizações que possuem stages sem pipelineId
  const orgsWithStages = await prisma.$queryRaw<Array<{ organization_id: string }>>`
    SELECT DISTINCT organization_id
    FROM pipeline_stages
    WHERE pipeline_id IS NULL
      AND organization_id IS NOT NULL
  `

  console.log(`[Backfill] ${orgsWithStages.length} organizações precisam de backfill.`)

  for (const row of orgsWithStages) {
    const organizationId = row.organization_id

    await prisma.$transaction(async (tx) => {
      // Cria produto padrão
      const product = await tx.product.create({
        data: {
          organizationId,
          name: 'Produto Padrão',
          description: 'Produto criado automaticamente durante a migração do sistema.',
          color: '#6366f1',
          status: 'ACTIVE',
        },
      })
      console.log(`[Backfill] Org ${organizationId} -> Product ${product.id}`)

      // Cria pipeline padrão
      const pipeline = await tx.pipeline.create({
        data: {
          productId: product.id,
          organizationId,
          name: 'Pipeline Principal',
          isDefault: true,
          status: 'ACTIVE',
        },
      })
      console.log(`[Backfill] Org ${organizationId} -> Pipeline ${pipeline.id}`)

      // Atualiza stages existentes para o pipeline padrão
      const updatedStages = await tx.pipelineStage.updateMany({
        where: { organizationId, pipelineId: null },
        data: { pipelineId: pipeline.id },
      })
      console.log(`[Backfill] Org ${organizationId} -> ${updatedStages.count} stages atualizados`)

      // Atualiza deals existentes para o produto e pipeline padrão
      const updatedDeals = await tx.deal.updateMany({
        where: { organizationId, productId: null },
        data: { productId: product.id, pipelineId: pipeline.id },
      })
      console.log(`[Backfill] Org ${organizationId} -> ${updatedDeals.count} deals atualizados`)
    })
  }
}

async function backfillPerciNR1() {
  console.log('[Backfill] Iniciando backfill específico da PERCI (NR1)...')

  const organizationId = PERCI_ORG_ID

  await prisma.$transaction(async (tx) => {
    // Verifica se já existe produto NR1
    const existingNr1 = await tx.product.findFirst({
      where: { organizationId, name: 'NR1' },
    })

    if (existingNr1) {
      console.log(`[Backfill] Produto NR1 já existe (${existingNr1.id}). Pulando.`)
      return
    }

    // Cria produto NR1
    const nr1Product = await tx.product.create({
      data: {
        organizationId,
        name: 'NR1',
        description: 'Negócio Reputacional 1 - migrado das tags NR1_*',
        color: '#f59e0b',
        status: 'ACTIVE',
      },
    })
    console.log(`[Backfill] PERCI -> Product NR1 ${nr1Product.id}`)

    // Cria pipeline NR1
    const nr1Pipeline = await tx.pipeline.create({
      data: {
        productId: nr1Product.id,
        organizationId,
        name: 'Pipeline NR1',
        isDefault: true,
        status: 'ACTIVE',
      },
    })
    console.log(`[Backfill] PERCI -> Pipeline NR1 ${nr1Pipeline.id}`)

    // Migra tags com prefixo NR1_
    const nr1Tags = await tx.tag.findMany({
      where: {
        organizationId,
        name: { startsWith: 'NR1_' },
      },
    })

    console.log(`[Backfill] PERCI -> ${nr1Tags.length} tags NR1_ encontradas`)

    for (const tag of nr1Tags) {
      const newName = tag.name.replace(/^NR1_\s*/, '').trim()
      await tx.tag.update({
        where: { id: tag.id },
        data: {
          productId: nr1Product.id,
          name: newName || tag.name,
        },
      })
      console.log(`[Backfill] PERCI -> Tag "${tag.name}" renomeada para "${newName}" e vinculada ao NR1`)
    }

    // Opcional: migrar deals que possuem a tag NR1_* para o produto NR1
    // Nota: como deals usam tags String[], fazemos um scan simples.
    const dealsWithNR1Tag = await tx.deal.findMany({
      where: {
        organizationId,
        tags: { hasSome: nr1Tags.map((t) => t.name) },
      },
    })

    for (const deal of dealsWithNR1Tag) {
      await tx.deal.update({
        where: { id: deal.id },
        data: {
          productId: nr1Product.id,
          pipelineId: nr1Pipeline.id,
        },
      })
      console.log(`[Backfill] PERCI -> Deal ${deal.id} migrado para NR1`)
    }

    // Atualiza stages existentes da PERCI para o pipeline NR1 (se ainda estiverem sem pipeline)
    const updatedStages = await tx.pipelineStage.updateMany({
      where: { organizationId, pipelineId: null },
      data: { pipelineId: nr1Pipeline.id },
    })
    console.log(`[Backfill] PERCI -> ${updatedStages.count} stages atualizados para Pipeline NR1`)

    // Atualiza deals restantes da PERCI para o produto/pipeline padrão (se ainda estiverem vazios)
    const updatedDeals = await tx.deal.updateMany({
      where: { organizationId, productId: null },
      data: { productId: nr1Product.id, pipelineId: nr1Pipeline.id },
    })
    console.log(`[Backfill] PERCI -> ${updatedDeals.count} deals restantes atualizados para NR1`)
  })
}

async function main() {
  try {
    await backfillDefaultProducts()
    await backfillPerciNR1()
    console.log('[Backfill] Concluído com sucesso!')
  } catch (error) {
    console.error('[Backfill] Erro fatal:', error)
    process.exit(1)
  } finally {
    await prisma['$disconnect']()
  }
}

main()
