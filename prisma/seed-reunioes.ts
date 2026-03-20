import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de reuniões...')

  // Buscar uma organização existente
  const organization = await prisma.organization.findFirst()
  
  if (!organization) {
    console.error('❌ Nenhuma organização encontrada. Crie uma organização primeiro.')
    process.exit(1)
  }

  // Buscar ou criar um usuário para ser o responsável
  let user = await prisma.user.findFirst({
    where: { organizationId: organization.id }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@nexia.com',
        name: 'Usuário Demo',
        password: 'hashed_password_here',
        organizationId: organization.id,
        role: 'ADMIN',
      }
    })
    console.log('✅ Usuário demo criado:', user.id)
  }

  // Criar ou atualizar contatos (leads) para vincular às reuniões
  const contato = await prisma.contact.upsert({
    where: {
      organizationId_phone: {
        organizationId: organization.id,
        phone: '+55 11 98765-4321',
      }
    },
    update: {
      name: 'João Silva',
      metadata: {
        email: 'joao.silva@empresa.com',
        company: 'Empresa ABC',
        jobTitle: 'Diretor Comercial',
        city: 'São Paulo',
        state: 'SP',
      },
    },
    create: {
      organizationId: organization.id,
      name: 'João Silva',
      phone: '+55 11 98765-4321',
      status: 'ACTIVE',
      metadata: {
        email: 'joao.silva@empresa.com',
        company: 'Empresa ABC',
        jobTitle: 'Diretor Comercial',
        city: 'São Paulo',
        state: 'SP',
      },
    }
  })
  console.log('✅ Contato:', contato.id, '-', contato.name)

  // Criar ou atualizar segundo contato
  const contato2 = await prisma.contact.upsert({
    where: {
      organizationId_phone: {
        organizationId: organization.id,
        phone: '+55 11 91234-5678',
      }
    },
    update: {
      name: 'Maria Santos',
      metadata: {
        email: 'maria.santos@techcorp.com',
        company: 'TechCorp Solutions',
        jobTitle: 'CEO',
        city: 'Rio de Janeiro',
        state: 'RJ',
      },
    },
    create: {
      organizationId: organization.id,
      name: 'Maria Santos',
      phone: '+55 11 91234-5678',
      status: 'ACTIVE',
      metadata: {
        email: 'maria.santos@techcorp.com',
        company: 'TechCorp Solutions',
        jobTitle: 'CEO',
        city: 'Rio de Janeiro',
        state: 'RJ',
      },
    }
  })
  console.log('✅ Contato 2:', contato2.id, '-', contato2.name)

  // Criar agendamentos (schedules) do tipo MEETING
  const schedule1 = await prisma.schedule.create({
    data: {
      organizationId: organization.id,
      type: 'meeting',
      title: 'Apresentação de Proposta Comercial',
      description: 'Reunião para apresentar proposta de implementação do sistema CRM',
      contactId: contato.id,
      assignedTo: user.id,
      startTime: new Date('2026-03-18T14:00:00'),
      endTime: new Date('2026-03-18T15:00:00'),
      status: 'completed',
      location: 'Google Meet',
      completedAt: new Date('2026-03-18T15:00:00'),
    }
  })
  console.log('✅ Agendamento 1 criado:', schedule1.id)

  const schedule2 = await prisma.schedule.create({
    data: {
      organizationId: organization.id,
      type: 'meeting',
      title: 'Alinhamento de Onboarding',
      description: 'Reunião de alinhamento sobre o processo de onboarding e treinamento da equipe',
      contactId: contato2.id,
      assignedTo: user.id,
      startTime: new Date('2026-03-19T10:00:00'),
      endTime: new Date('2026-03-19T11:30:00'),
      status: 'completed',
      location: 'Sala de Reuniões - Teams',
      completedAt: new Date('2026-03-19T11:30:00'),
    }
  })
  console.log('✅ Agendamento 2 criado:', schedule2.id)

  // Criar transcrição para a primeira reunião
  const transcription1 = await prisma.transcription.create({
    data: {
      organizationId: organization.id,
      contactId: contato.id,
      scheduleId: schedule1.id,
      title: 'Apresentação de Proposta Comercial - João Silva',
      source: 'MEETING',
      status: 'COMPLETED',
      duration: 3600, // 1 hora em segundos
      audioUrl: 'https://storage.example.com/recordings/reuniao-001.mp3',
      transcript: `Consultor: Bom dia, João! Obrigado por disponibilizar seu tempo. Hoje vou apresentar nossa proposta para otimizar o atendimento da Empresa ABC.

João Silva: Bom dia! Estou animado para ver o que vocês prepararam.

Consultor: Perfeito. Conforme conversamos, identificamos que vocês perdem cerca de 40% dos leads por falta de follow-up automatizado. Nossa solução pode reduzir isso para menos de 5%.

João Silva: Isso é exatamente o que precisamos. E quanto à integração com nosso CRM atual?

Consultor: Temos API nativa e já integramos com mais de 50 ferramentas. O processo leva em média 2 dias.

João Silva: Ótimo. E o investimento?

Consultor: Para o volume da sua operação, estamos falando de R$ 2.490/mês, com implementação gratuita neste mês.

João Silva: Me parece justo. Preciso apresentar para o CFO, mas estou inclinado a prosseguir.

Consultor: Excelente! Posso agendar uma call de 15 minutos com ele ainda essa semana?

João Silva: Pode sim. Vou verificar a agenda dele e te retorno.`,
      summary: 'Reunião produtiva onde foi apresentada a proposta comercial. João demonstrou interesse no valor de R$ 2.490/mês e vai apresentar para o CFO. Necessário agendar follow-up com o CFO ainda esta semana.',
      keyTopics: ['Proposta Comercial', 'Integração CRM', 'Investimento', 'Follow-up'],
      sentiment: 'POSITIVE',
      objections: ['Aprovação do CFO', 'Timing de implementação'],
      actionItems: ['Agendar call com CFO', 'Enviar material complementar', 'Preparar contrato'],
      language: 'pt-BR',
    }
  })
  console.log('✅ Transcrição 1 criada:', transcription1.id)

  // Criar transcrição para a segunda reunião
  const transcription2 = await prisma.transcription.create({
    data: {
      organizationId: organization.id,
      contactId: contato2.id,
      scheduleId: schedule2.id,
      title: 'Alinhamento de Onboarding - Maria Santos',
      source: 'MEETING',
      status: 'COMPLETED',
      duration: 5400, // 1h30 em segundos
      audioUrl: 'https://storage.example.com/recordings/reuniao-002.mp3',
      transcript: `Especialista: Olá Maria! Seja bem-vinda à Nexia. Vamos alinhar todo o processo de onboarding para sua equipe.

Maria Santos: Oi! Obrigada. Tenho algumas dúvidas sobre o treinamento da equipe.

Especialista: Claro! Vou explicar nosso processo. Temos 3 fases: configuração técnica, treinamento dos gestores e capacitação dos atendentes. Total de 2 semanas.

Maria Santos: E quantos atendentes podem participar do treinamento?

Especialista: Ilimitado. Fazemos sessões em grupos de até 10 pessoas para garantir qualidade, mas podemos fazer quantas sessões forem necessárias.

Maria Santos: Perfeito. Temos 25 atendentes, então precisaríamos de 3 sessões.

Especialista: Exatamente. Além disso, fornecemos material em vídeo para consulta posterior e nosso suporte é 24/7 nos primeiros 30 dias.

Maria Santos: Gostei do suporte dedicado. E a migração dos dados do sistema antigo?

Especialista: Fazemos a migração completa sem custo adicional. Precisamos apenas de um exporte em CSV ou Excel.

Maria Santos: Ótimo. Quando podemos começar?

Especialista: Posso agendar a primeira sessão para segunda-feira que vem. A equipe técnica já pode começar a configuração essa semana.

Maria Santos: Perfeito! Vou alinhar com minha equipe.`,
      summary: 'Onboarding alinhado com sucesso. Maria tem 25 atendentes e faremos 3 sessões de treinamento. Migração de dados inclusa sem custo. Primeira sessão agendada para segunda-feira, configuração técnica inicia esta semana.',
      keyTopics: ['Onboarding', 'Treinamento', 'Migração de Dados', 'Suporte 24/7'],
      sentiment: 'POSITIVE',
      objections: ['Número de atendentes para treinar'],
      actionItems: ['Iniciar configuração técnica', 'Agendar 3 sessões de treinamento', 'Solicitar export de dados', 'Enviar calendário de treinamentos'],
      language: 'pt-BR',
    }
  })
  console.log('✅ Transcrição 2 criada:', transcription2.id)

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log('   • 2 Contatos criados/atualizados (João Silva e Maria Santos)')
  console.log('   • 2 Agendamentos vinculados aos contatos')
  console.log('   • 2 Transcrições com análise de IA completa')
  console.log('\n🔗 Acesse: http://localhost:3000/agendamentos/reunioes')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
