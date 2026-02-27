/**
 * Mock Transcriptions
 * Transcrições simuladas de calls de vendas em português (Brasil)
 * Contém objeções realistas para demonstração do sistema de IA
 */

import { detectObjections, analyzeSentiment } from './ai/objection-detector'

export interface CallTranscription {
  id: string
  contactId: string
  contactName: string
  date: string
  duration: number // minutos
  transcript: string
  objections: ReturnType<typeof detectObjections>
  sentiment: ReturnType<typeof analyzeSentiment>
  converted: boolean
  resolutionDays?: number // Dias até conversão após call
}

/**
 * 20 transcrições realistas de calls de vendas B2B em português
 */
export const MOCK_TRANSCRIPTIONS: CallTranscription[] = [
  {
    id: 'call-001',
    contactId: 'contact-1',
    contactName: 'João Silva',
    date: '2026-02-20T10:30:00',
    duration: 28,
    transcript: 'Vendedor: Bom dia João, entendi que você está buscando uma solução de CRM. Deixa eu te mostrar nossa plataforma. Cliente: Legal, mas olha, preciso ser sincero... o preço está um pouco alto para nossa realidade atual. Não temos orçamento aprovado para esse tipo de investimento agora. Vendedor: Entendo a preocupação. Quanto você tem de orçamento? Cliente: Olha, preciso consultar meu gestor antes de definir valores. Não sou eu quem decide sozinho essas coisas.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 45 },
    converted: false,
    resolutionDays: undefined
  },
  {
    id: 'call-002',
    contactId: 'contact-2',
    contactName: 'Maria Santos',
    date: '2026-02-19T14:00:00',
    duration: 35,
    transcript: 'Vendedor: Maria, vou te mostrar nossas integrações. Cliente: Perfeito! Estou adorando a interface. A proposta está ótima, faz muito sentido para nossa operação. Me convenceu! Vamos fechar isso logo, quando podemos começar? Vendedor: Excelente! Posso preparar o contrato hoje mesmo. Cliente: Ótimo, concordo com tudo que apresentou.',
    objections: [],
    sentiment: { sentiment: 'positive', score: 85 },
    converted: true,
    resolutionDays: 2
  },
  {
    id: 'call-003',
    contactId: 'contact-3',
    contactName: 'Carlos Oliveira',
    date: '2026-02-18T11:15:00',
    duration: 42,
    transcript: 'Cliente: Olha, gostei da apresentação mas estamos usando outro CRM há 3 anos. Já temos outro fornecedor bem estruturado. Vendedor: Entendo. Qual sua principal dor? Cliente: Nosso sistema atual não integra com WhatsApp, mas estamos comparando opções no mercado. Vendo outras empresas também.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 50 },
    converted: false
  },
  {
    id: 'call-004',
    contactId: 'contact-4',
    contactName: 'Ana Costa',
    date: '2026-02-17T16:30:00',
    duration: 25,
    transcript: 'Vendedor: Ana, qual sua opinião? Cliente: Gostei muito! A solução é interessante e resolve nosso problema. Mas não é o momento ideal para implementar agora. Vou avaliar melhor no próximo trimestre. Talvez depois conseguimos viabilizar.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 55 },
    converted: true,
    resolutionDays: 45
  },
  {
    id: 'call-005',
    contactId: 'contact-5',
    contactName: 'Pedro Alves',
    date: '2026-02-16T09:45:00',
    duration: 38,
    transcript: 'Cliente: Preciso de uma funcionalidade específica: relatórios personalizados com logo da empresa. Vocês têm isso? Vendedor: Atualmente não temos essa feature exata. Cliente: Ah, então falta funcionalidade importante pra gente. Também preciso de integração com nosso ERP customizado.',
    objections: [],
    sentiment: { sentiment: 'negative', score: 35 },
    converted: false
  },
  {
    id: 'call-006',
    contactId: 'contact-6',
    contactName: 'Juliana Ferreira',
    date: '2026-02-15T13:20:00',
    duration: 30,
    transcript: 'Vendedor: Juliana, o valor mensal é R$ 890. Cliente: Nossa, está muito caro mesmo! Acima do esperado. Tem desconto disponível? O investimento alto está complicando nossa decisão. Não cabe no orçamento atual.',
    objections: [],
    sentiment: { sentiment: 'negative', score: 30 },
    converted: true,
    resolutionDays: 18
  },
  {
    id: 'call-007',
    contactId: 'contact-7',
    contactName: 'Roberto Lima',
    date: '2026-02-14T10:00:00',
    duration: 45,
    transcript: 'Cliente: Excelente demonstração! Está perfeito para nosso time. Concordo com a proposta, mas preciso da aprovação da diretoria. Não decido sozinho investimentos acima de 10 mil. Vou falar com meu chefe semana que vem.',
    objections: [],
    sentiment: { sentiment: 'positive', score: 70 },
    converted: true,
    resolutionDays: 12
  },
  {
    id: 'call-008',
    contactId: 'contact-8',
    contactName: 'Fernanda Rocha',
    date: '2026-02-13T15:45:00',
    duration: 32,
    transcript: 'Vendedor: Fernanda, o que achou? Cliente: Ótimo produto! Adorei as automações. Faz muito sentido para nosso fluxo. Vamos fechar já! Quando podemos começar o onboarding? Vendedor: Posso agendar para próxima semana. Cliente: Perfeito, me convenceu totalmente!',
    objections: [],
    sentiment: { sentiment: 'positive', score: 95 },
    converted: true,
    resolutionDays: 1
  },
  {
    id: 'call-009',
    contactId: 'contact-9',
    contactName: 'Lucas Martins',
    date: '2026-02-12T11:30:00',
    duration: 28,
    transcript: 'Cliente: Interessante, mas estamos fazendo cotação com 4 fornecedores. Analisando o mercado completo. Já usamos ferramenta similar da concorrência. Pesquisando todas alternativas antes de decidir.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 45 },
    converted: false
  },
  {
    id: 'call-010',
    contactId: 'contact-10',
    contactName: 'Patrícia Souza',
    date: '2026-02-11T14:15:00',
    duration: 36,
    transcript: 'Vendedor: Patrícia, temos trial de 14 dias. Cliente: Legal, mas ainda não é o momento. Preciso pensar melhor. Deixa eu ver internamente e talvez retorno mês que vem. Vou avaliar com calma.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 40 },
    converted: false
  },
  {
    id: 'call-011',
    contactId: 'contact-11',
    contactName: 'Ricardo Barbosa',
    date: '2026-02-10T09:00:00',
    duration: 40,
    transcript: 'Cliente: Sistema bom, mas infelizmente não possui integração com Pipedrive que usamos. Falta integração crítica. Não tem essa funcionalidade essencial que precisamos. Sem isso fica limitado demais.',
    objections: [],
    sentiment: { sentiment: 'negative', score: 35 },
    converted: false
  },
  {
    id: 'call-012',
    contactId: 'contact-12',
    contactName: 'Camila Nunes',
    date: '2026-02-09T16:00:00',
    duration: 33,
    transcript: 'Vendedor: Camila, fechamos? Cliente: Adorei! Solução ideal para nossa empresa. Excelente custo-benefício. Me convenceu completamente! Vamos fechar hoje mesmo. Quando recebo o contrato? Vendedor: Envio ainda hoje! Cliente: Ótimo, concordo com tudo!',
    objections: [],
    sentiment: { sentiment: 'positive', score: 92 },
    converted: true,
    resolutionDays: 1
  },
  {
    id: 'call-013',
    contactId: 'contact-13',
    contactName: 'Bruno Cardoso',
    date: '2026-02-08T10:45:00',
    duration: 29,
    transcript: 'Cliente: Valor está muito caro para nosso porte. Somos pequena empresa. Muito investimento para começar. Tem desconto especial para startups? Preço alto demais infelizmente.',
    objections: [],
    sentiment: { sentiment: 'negative', score: 32 },
    converted: false
  },
  {
    id: 'call-014',
    contactId: 'contact-14',
    contactName: 'Renata Silva',
    date: '2026-02-07T13:30:00',
    duration: 37,
    transcript: 'Vendedor: Renata, o que você pensa? Cliente: Olha, gostei mas depende da aprovação do CEO. Decisão conjunta com toda equipe. Preciso consultar o time comercial também. Falo com eles e retorno semana que vem.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 55 },
    converted: true,
    resolutionDays: 20
  },
  {
    id: 'call-015',
    contactId: 'contact-15',
    contactName: 'Gustavo Pinto',
    date: '2026-02-06T15:00:00',
    duration: 44,
    transcript: 'Cliente: Sistema interessante! Gostei das funcionalidades. Resolve nosso problema principal. Só preciso confirmar com meu gestor o orçamento disponível este mês. Mas está excelente! Cliente: Combina perfeitamente com nossa operação.',
    objections: [],
    sentiment: { sentiment: 'positive', score: 75 },
    converted: true,
    resolutionDays: 8
  },
  {
    id: 'call-016',
    contactId: 'contact-16',
    contactName: 'Daniela Costa',
    date: '2026-02-05T11:00:00',
    duration: 31,
    transcript: 'Vendedor: Daniela, podemos começar? Cliente: Não agora infelizmente. Próximo mês temos mais clareza do orçamento. Ainda não estamos prontos para implementar. Vou pensar e retorno depois.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 42 },
    converted: false
  },
  {
    id: 'call-017',
    contactId: 'contact-17',
    contactName: 'Marcelo Santos',
    date: '2026-02-04T14:45:00',
    duration: 35,
    transcript: 'Cliente: Perfeito! Apresentação excelente. Está ótimo para nosso processo. Adorei as automações. Vamos fechar! Me manda o contrato que assino hoje. Cliente: Concordo com toda proposta!',
    objections: [],
    sentiment: { sentiment: 'positive', score: 88 },
    converted: true,
    resolutionDays: 2
  },
  {
    id: 'call-018',
    contactId: 'contact-18',
    contactName: 'Beatriz Oliveira',
    date: '2026-02-03T09:30:00',
    duration: 39,
    transcript: 'Cliente: Já temos sistema consolidado há anos. Comparando opções mas usando concorrente principal. Vocês têm diferencial claro? Vendedor: Sim, nossas integrações. Cliente: Interessante, mas estamos estudando outras empresas também.',
    objections: [],
    sentiment: { sentiment: 'neutral', score: 48 },
    converted: false
  },
  {
    id: 'call-019',
    contactId: 'contact-19',
    contactName: 'Felipe Rodrigues',
    date: '2026-02-02T16:15:00',
    duration: 27,
    transcript: 'Vendedor: Felipe, fechamos hoje? Cliente: Sistema bom mas falta funcionalidade de telefonia integrada. Não tem esse recurso importante. Preciso dessa feature específica. Sem isso fica incompleto.',
    objections: [],
    sentiment: { sentiment: 'negative', score: 38 },
    converted: false
  },
  {
    id: 'call-020',
    contactId: 'contact-20',
    contactName: 'Amanda Lima',
    date: '2026-02-01T10:15:00',
    duration: 34,
    transcript: 'Cliente: Excelente solução! Está perfeito. Resolve tudo que precisamos. Adorei a interface intuitiva. Vamos fechar rapidinho! Quando começa a vigorar? Vendedor: Imediatamente. Cliente: Perfeito, me convenceu! Ótimo trabalho!',
    objections: [],
    sentiment: { sentiment: 'positive', score: 90 },
    converted: true,
    resolutionDays: 1
  }
]

// Processa todas as transcrições para detectar objeções e sentimento
MOCK_TRANSCRIPTIONS.forEach(t => {
  t.objections = detectObjections(t.transcript)
  t.sentiment = analyzeSentiment(t.transcript)
})
