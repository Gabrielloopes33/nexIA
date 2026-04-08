/**
 * Script: create-test-typebot-contact.ts
 * Cria um contato de teste com dados do Typebot para verificar a exibição
 * no painel de Contexto do Cliente
 *
 * Uso: npx tsx scripts/create-test-typebot-contact.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Use a organização padrão ou especifique um organizationId
  const organizationId = process.argv[2] || '733221c6-4f41-43bc-82ad-d81ae29b51d6'

  console.log('========================================')
  console.log('Criando contato de teste com Typebot')
  console.log(`Organization ID: ${organizationId}`)
  console.log('========================================\n')

  // Cria o contato com metadata do Typebot
  const contact = await prisma.contact.create({
    data: {
      organizationId,
      name: 'Carlos Silva - Teste NR-01',
      phone: '5511998887777',
      status: 'ACTIVE',
      lastInteractionAt: new Date(),
      metadata: {
        source: 'typebot',
        typebot: {
          cargo: 'Gerente de RH',
          colaboradores: '50-100 funcionários',
          responsavel: 'Sim, sou eu quem cuida disso',
          estagio: 'Em diligência',
          preocupacao: 'Multas por não conformidade com a NR-01 e riscos de fiscalização',
          afastamento: 'Tivemos 2 casos de afastamento por estresse ocupacional no último ano',
          levantamento: 'Não, nunca fizemos um levantamento completo',
          decisao: 'Estamos avaliando opções para adequação em 2026',
          problema: 'Falta de clareza sobre as obrigações específicas da norma',
          duvida: 'Quanto tempo leva para implementar o programa completo?',
          submittedAt: '31 de mar., 11:03',
          email: 'carlos.silva@empresa-teste.com.br'
        }
      }
    }
  })

  console.log('✅ Contato criado com sucesso!')
  console.log(`ID: ${contact.id}`)
  console.log(`Nome: ${contact.name}`)
  console.log(`Telefone: ${contact.phone}`)

  // Cria uma conversa para o contato
  const conversation = await prisma.conversation.create({
    data: {
      organizationId,
      contactId: contact.id,
      status: 'active',
    }
  })

  console.log(`\n✅ Conversa criada!`)
  console.log(`Conversation ID: ${conversation.id}`)

  // Cria uma mensagem de boas-vindas
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      contactId: contact.id,
      content: '🤖 Olá Carlos! Recebemos suas respostas da pesquisa NR-01. Em breve nosso consultor entrará em contato.',
      direction: 'OUTBOUND',
      status: 'SENT',
    }
  })

  console.log('\n✅ Mensagem criada!')

  // Cria uma nota manual para mostrar a diferença
  await prisma.contactNote.create({
    data: {
      contactId: contact.id,
      text: 'Este é um contato de teste criado para demonstrar a integração com Typebot.\n\nO card acima mostra os dados da pesquisa NR-01 preenchida pelo lead.',
      author: 'Sistema',
      createdBy: 'system',
    }
  })

  console.log('✅ Nota criada!')

  console.log('\n========================================')
  console.log('Resumo:')
  console.log('========================================')
  console.log(`Contato: ${contact.name}`)
  console.log(`Phone: ${contact.phone}`)
  console.log(`Conversation ID: ${conversation.id}`)
  console.log('\n👉 Acesse o painel de conversas e abra esta conversa para ver')
  console.log('   os dados do Typebot na seção "Notas e Observações"')
  console.log('========================================')
}

main()
  .catch((error) => {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
