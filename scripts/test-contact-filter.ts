/**
 * Script: test-contact-filter.ts
 * Testa o filtro de tags na API de contatos
 * 
 * Uso: npx tsx scripts/test-contact-filter.ts [tagId]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const organizationId = '733221c6-4f41-43bc-82ad-d81ae29b51d6'
  
  console.log('========================================')
  console.log('Teste de Filtro de Contatos por Tags')
  console.log('========================================\n')

  // 1. Lista todas as tags da organização
  console.log('1. Tags disponíveis:')
  const tags = await prisma.tag.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { contactTags: true }
      }
    }
  })

  if (tags.length === 0) {
    console.log('   Nenhuma tag encontrada!')
    console.log('\n   Criando tags de teste...')
    
    const newTags = await prisma.tag.createMany({
      data: [
        { organizationId, name: 'Typebot', color: '#6366f1', source: 'manual' },
        { organizationId, name: 'Pesquisa NR-01', color: '#8b5cf6', source: 'manual' },
        { organizationId, name: 'Lead Quente', color: '#ef4444', source: 'manual' },
        { organizationId, name: 'Cliente', color: '#10b981', source: 'manual' },
      ]
    })
    
    console.log(`   ${newTags.count} tags criadas!`)
    
    // Recarrega as tags
    const updatedTags = await prisma.tag.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { contactTags: true }
        }
      }
    })
    
    updatedTags.forEach(tag => {
      console.log(`   - ${tag.name} (ID: ${tag.id}) - ${tag._count.contactTags} contatos`)
    })
  } else {
    tags.forEach(tag => {
      console.log(`   - ${tag.name} (ID: ${tag.id}) - ${tag._count.contactTags} contatos`)
    })
  }

  // 2. Lista alguns contatos com tags
  console.log('\n2. Contatos com tags:')
  const contactsWithTags = await prisma.contact.findMany({
    where: { 
      organizationId,
      contactTags: {
        some: {}
      }
    },
    include: {
      contactTags: {
        include: {
          tag: true
        }
      }
    },
    take: 5
  })

  if (contactsWithTags.length === 0) {
    console.log('   Nenhum contato com tags encontrado.')
    console.log('\n   Para testar o filtro, primeiro adicione tags a alguns contatos:')
    console.log('   1. Vá em Contatos')
    console.log('   2. Clique em um contato')
    console.log('   3. Adicione uma tag')
  } else {
    contactsWithTags.forEach(contact => {
      const tagNames = contact.contactTags.map(ct => ct.tag.name).join(', ')
      console.log(`   - ${contact.name || contact.phone} - Tags: ${tagNames}`)
    })
  }

  // 3. Testa o filtro por uma tag específica
  const tagIdToFilter = process.argv[2] || tags[0]?.id
  
  if (tagIdToFilter) {
    const tag = tags.find(t => t.id === tagIdToFilter) || await prisma.tag.findUnique({
      where: { id: tagIdToFilter }
    })
    
    if (tag) {
      console.log(`\n3. Testando filtro por tag: ${tag.name} (${tagIdToFilter})`)
      
      const filteredContacts = await prisma.contact.findMany({
        where: {
          organizationId,
          contactTags: {
            some: {
              tagId: tagIdToFilter
            }
          }
        },
        include: {
          contactTags: {
            include: {
              tag: true
            }
          }
        }
      })
      
      console.log(`   Resultado: ${filteredContacts.length} contatos encontrados`)
      filteredContacts.forEach(contact => {
        const tagNames = contact.contactTags.map(ct => ct.tag.name).join(', ')
        console.log(`   - ${contact.name || contact.phone} - Tags: ${tagNames}`)
      })
    }
  }

  console.log('\n========================================')
  console.log('Para testar no frontend:')
  console.log('========================================')
  console.log('1. Acesse /contatos')
  console.log('2. Clique em "Tags" no filtro')
  console.log('3. Selecione uma tag')
  console.log('4. Verifique se os contatos são filtrados')
  console.log('========================================')
}

main()
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
