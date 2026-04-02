/**
 * Script de migração: move o pipeline antigo (com todos os stages e deals)
 * do "Produto Padrão" para o produto "NR1".
 *
 * Contexto:
 *   O backfill criou "Produto Padrão" + "Pipeline Principal" com todos os stages/deals.
 *   Depois criou "NR1" + "Pipeline NR1" (vazio).
 *   Este script inverte: o pipeline antigo passa a pertencer ao NR1.
 *
 * Uso:
 *   npx tsx scripts/migrate-pipeline-to-nr1.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ORG_ID = '733221c6-4f41-43bc-82ad-d81ae29b51d6'

async function main() {
  console.log('[Migrate] Iniciando migração do pipeline para NR1...')

  await prisma.$transaction(async (tx) => {
    // 1. Buscar produto NR1
    const nr1 = await tx.product.findFirst({
      where: { organizationId: ORG_ID, name: 'NR1' },
      include: { pipelines: true },
    })
    if (!nr1) throw new Error('Produto NR1 não encontrado')
    console.log(`[Migrate] NR1 id=${nr1.id}, pipelines atuais: ${nr1.pipelines.map(p => p.name).join(', ')}`)

    // 2. Buscar Produto Padrão
    const padrao = await tx.product.findFirst({
      where: { organizationId: ORG_ID, name: 'Produto Padrão' },
      include: { pipelines: true },
    })
    if (!padrao) throw new Error('Produto Padrão não encontrado')
    console.log(`[Migrate] Produto Padrão id=${padrao.id}, pipelines: ${padrao.pipelines.map(p => p.name).join(', ')}`)

    const pipelinePrincipal = padrao.pipelines.find(p => p.name === 'Pipeline Principal')
    if (!pipelinePrincipal) throw new Error('Pipeline Principal não encontrado em Produto Padrão')

    const pipelineNr1Vazio = nr1.pipelines.find(p => p.name === 'Pipeline NR1')

    // 3. Deletar o pipeline vazio do NR1 (se existir)
    if (pipelineNr1Vazio) {
      await tx.pipeline.delete({ where: { id: pipelineNr1Vazio.id } })
      console.log(`[Migrate] Pipeline NR1 vazio deletado (${pipelineNr1Vazio.id})`)
    }

    // 4. Reassociar "Pipeline Principal" ao produto NR1
    await tx.pipeline.update({
      where: { id: pipelinePrincipal.id },
      data: { productId: nr1.id },
    })
    console.log(`[Migrate] Pipeline Principal (${pipelinePrincipal.id}) agora pertence ao NR1`)

    // 5. Mover todos os deals do Produto Padrão para NR1
    const updatedDeals = await tx.deal.updateMany({
      where: { organizationId: ORG_ID, productId: padrao.id },
      data: { productId: nr1.id },
    })
    console.log(`[Migrate] ${updatedDeals.count} deals migrados para NR1`)

    // 6. Deletar Produto Padrão (agora sem pipelines nem deals)
    await tx.product.delete({ where: { id: padrao.id } })
    console.log(`[Migrate] Produto Padrão deletado`)
  })

  console.log('[Migrate] Concluído com sucesso!')
}

main()
  .catch((err) => {
    console.error('[Migrate] Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
