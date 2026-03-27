// ─── Navbar ───
export const NAV = {
  brand: "NexIA",
  links: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Soluções", href: "#solucoes" },
    { label: "Preços", href: "#precos" },
    { label: "Sobre", href: "#faq" },
  ],
  login: "Entrar",
  cta: "Começar Agora",
};

// ─── Hero ───
export const HERO = {
  badge: "CRM Omnichannel com IA — Feito no Brasil",
  headlinePart1: "A empresa que responde primeiro fecha mais. O NexIA Chat garante que ",
  headlineHighlight: "você seja sempre essa empresa.",
  subtitle:
    "Centralize WhatsApp, Instagram e Messenger em um único fluxo inteligente. Deixe a IA vender enquanto você fecha outras vendas.",
  cta: "Conhecer os planos",
  stats: [
    { value: "+15k", label: "Empresas" },
    { value: "99.9%", label: "Disponibilidade" },
    { value: "24/7", label: "Suporte IA" },
    { value: "R$ 2B+", label: "Transacionados" },
  ],
};

// ─── Problem ───
export const PROBLEM = {
  tag: "O PROBLEMA REAL",
  title: "O caos da comunicação descentralizada está matando seu lucro.",
  paragraphs: [
    "Cada minuto que um lead espera por uma resposta no Direct, a chance de conversão cai drasticamente. Você não consegue estar em todos os lugares ao mesmo tempo.",
    "Planilhas perdem dados, abas do navegador travam e sua equipe fica sobrecarregada tentando filtrar quem realmente quer comprar.",
    "O resultado? Leads qualificados indo para a concorrência porque você simplesmente não viu a notificação a tempo.",
  ],
  cards: [
    {
      icon: "notifications_off",
      title: "Notificações Perdidas",
      description:
        "Mensagens enterradas no mar de notificações pessoais de diversos apps.",
    },
    {
      icon: "group_remove",
      title: "Equipe Desalinhada",
      description:
        "Vários atendentes respondendo à mesma pessoa ou deixando leads no vácuo.",
    },
    {
      icon: "database_off",
      title: "Dados Fragmentados",
      description:
        "O histórico do cliente está espalhado entre WhatsApp, CRM e notas mentais.",
    },
    {
      icon: "hourglass_empty",
      title: "Lentidão Fatal",
      description:
        "Processos manuais que impedem sua escala e frustram o consumidor moderno.",
    },
  ],
};

// ─── Features ───
export const FEATURES = {
  tag: "O MECANISMO ÚNICO",
  title: "Um ecossistema feito para vender no automático.",
  subtitle:
    "Transformamos a complexidade de múltiplos canais em uma interface única e poderosa de alta performance.",
  items: [
    {
      icon: "hub",
      title: "Central Omnichannel",
      description:
        "Centralize todas as conversas do WhatsApp, Instagram e Messenger em uma única tela fluida e organizada.",
    },
    {
      icon: "psychology",
      title: "IA de Qualificação",
      description:
        "Nossa IA nativa conversa com os leads, entende suas dores e só passa para o humano quem realmente está pronto para pagar.",
    },
    {
      icon: "api",
      title: "API Oficial da Meta",
      description:
        "Estabilidade e segurança total utilizando a API Cloud oficial para WhatsApp, Instagram e Messenger.",
    },
    {
      icon: "robot_2",
      title: "Automações No-Code",
      description:
        "Crie fluxos de atendimento complexos arrastando e soltando blocos, sem precisar escrever uma linha de código.",
    },
    {
      icon: "support_agent",
      title: "Multi-Atendentes",
      description:
        "Escale seu time sem limites. Distribua leads automaticamente por ordem de chegada ou especialidade.",
    },
    {
      icon: "analytics",
      title: "Dashboard de Métricas",
      description:
        "Métricas de tempo de resposta, conversão por atendente e ROI direto na sua tela com visualização premium.",
    },
  ],
};

// ─── Bento Grid ───
export const BENTO = {
  tag: "POR QUE FUNCIONA",
  title: "Uma ferramenta. Tudo que você precisava estar fazendo o tempo todo.",
  subtitle:
    "Não é mais uma plataforma para aprender. É o lugar onde o seu negócio para de vazar.",
  cards: {
    conversations: {
      icon: "forum",
      title: "Todas as conversas num só lugar",
      description:
        "WhatsApp, Instagram e chat no site respondidos da mesma tela sem alternar abas ou perder o contexto.",
      channels: ["WhatsApp", "Instagram", "Web Chat"],
      contacts: [
        { initials: "JD", color: "text-[#a88cfb]", time: "2 min atrás" },
        { initials: "MC", color: "text-primary", time: "12 min atrás" },
        { initials: "RS", color: "text-yellow" },
      ],
    },
    pipeline: {
      icon: "view_kanban",
      title: "Pipeline que você enxerga",
      description:
        "Cada lead no lugar certo, em cada etapa da venda, sem complicações visuais.",
      stages: ["Novo", "Proposta", "Fechado"],
    },
    ai: {
      icon: "psychology",
      title: "IA que trabalha",
      description:
        "Insights automáticos das suas conversas sem você configurar nada.",
      stat: "↑ 94% de conversas analisadas",
      bars: [
        { label: "Intenção", width: "85%" },
        { label: "Sentimento", width: "60%" },
      ],
    },
    leadHistory: {
      icon: "badge",
      title: "Cada lead com história",
      description:
        "Tags, segmentos e campos personalizados para saber tudo.",
      tags: ["Lead quente", "WhatsApp"],
    },
    agenda: {
      icon: "event_available",
      title: "Agenda integrada",
      description:
        "Tarefa e follow-up ligados diretamente ao seu contato.",
    },
  },
};

// ─── Social Proof ───
export const SOCIAL_PROOF = {
  tag: "PROVA SOCIAL",
  title: "Quem usa, escala sem atrito.",
  subtitle:
    "Resultados reais de empresas que decidiram profissionalizar sua comunicação.",
  testimonials: [
    {
      quote:
        "\u201CFinalmente conseguimos ter controle total sobre o que os atendentes falam no WhatsApp. O painel é incrível.\u201D",
      name: "Grazi Galego",
      role: "Especialista em Eventos",
      avatar: "/grazi.jpg",
    },
    {
      quote:
        "\u201CA integração omnichannel salvou nossa Black Friday. Lidamos com 10x mais leads com a mesma equipe.\u201D",
      name: "Adriane",
      role: "Psicóloga",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB7sMLyzfjwsHlkHQa0xAX8hTbdPG0YJC_yWfMKYfoHfSU0BJC2W_jusBcLp1korxniUYtFnJ66H-19YHFqB9eEO-gRo0WRXlt8sRhOyMs6lIMD6XKQC4z9mRHp6WZjky1l38fdYMJcsU4CxcCGP-0sryFiv3c3rdMtEo68VpVwKi82HE5rzT05TVAVNvoLFQ0rSvlHZdgaXQWCbrXm1WrFVE68x_Dk-iUny6I8HALrhdcHNJPRJQ6_j4N6rrsh_fer-MgDADeeCQ94",
    },
  ],
};

// ─── Value Stack (Pricing) ───
export const VALUE_STACK = {
  tag: "OFERTA DE LANÇAMENTO",
  title: "Escolha o plano ideal para seu negócio.",
  plans: [
    {
      name: "Plano Trimestral",
      subtitle: "Acesso total por 3 meses",
      price: "R$ 397",
      featured: false,
      href: "https://buy.stripe.com/dRmbIU7TC6wl4cB64O5os00",
      features: [
        "Plataforma Omnichannel com 3 atendentes",
        "Integração API Oficial da Meta",
        "Conexão com Evolution API",
        "Integração com IA",
        "Pipeline de vendas personalizado",
        "Agendamento de Reunião",
      ],
      cta: "Assinar Trimestral",
    },
    {
      name: "Plano Semestral",
      subtitle: "Acesso total por 6 meses",
      price: "R$ 1.297",
      badge: "Melhor Valor",
      featured: true,
      href: "https://buy.stripe.com/9B68wIei0g6VfVj9h05os01",
      features: [
        "Plataforma Omnichannel com 5 atendentes",
        "Integração API Oficial da Meta",
        "Conexão com Evolution API",
        "Conexão com Instagram",
        "Integração com IA",
        "Pipeline de vendas personalizado",
        "Agendamento de Reunião",
        "Suporte VIP para implementação e configuração",
        "Grupo exclusivo no WhatsApp",
      ],
      cta: "Assinar Plano Semestral",
    },
    {
      name: "Plano com IA de Vendas",
      subtitle: "Implementação completa feita pelo time NexIA",
      price: "Sob consulta",
      badge: "Premium",
      featured: false,
      premium: true,
      href: "https://wa.me/551151996563",
      isWhatsApp: true,
      features: [
        "Tudo dos planos Trimestral e Semestral",
        "IA personalizada de vendas feita pelo time NexIA",
        "Configuração e implementação completa",
        "Treinamento da IA com seu catálogo e tom de voz",
        "Suporte dedicado e acompanhamento contínuo",
      ],
      cta: "Falar com nosso time",
    },
  ],
};

// ─── Bio ───
export const BIO = {
  tag: "FEITO POR QUEM ENTENDE",
  name: "Ana Paula Perci",
  highlight:
    "Minhas IAs já venderam múltiplos sete dígitos e atenderam mais de 2 milhões de leads.",
  description:
    "Especialista em automação, inteligência artificial aplicada e atendimento digital. Criadora do NexIA Chat e fundadora da NexIA Lab, onde desenvolve soluções que conectam tecnologia de ponta com resultados reais para empresas que querem escalar seu atendimento sem perder a qualidade.",
};

// ─── FAQ ───
export const FAQ = {
  tag: "DÚVIDAS FREQUENTES",
  title: "Tudo o que você precisa saber.",
  items: [
    {
      question: "Preciso de um número de WhatsApp Business API?",
      answer:
        "Sim, para garantir a estabilidade e segurança oficial, utilizamos a API Cloud oficial da Meta. Oferecemos suporte completo para sua configuração.",
    },
    {
      question: "A IA consegue fechar vendas sozinha?",
      answer:
        "No nosso sistema a integração com IA funciona de duas formas: você pode integrar uma IA que você já tenha ou contratar o desenvolvimento da IA de vendas pra sua empresa, para isso entre em contato com o nosso time e um projeto completo será desenvolvido pra você.",
    },
    {
      question: "Funciona com quantos atendentes?",
      answer:
        "Dependendo do seu plano, você pode ter desde 3 até ilimitados atendentes operando simultaneamente no mesmo número de WhatsApp.",
    },
    {
      question: "Tenho suporte para implementar?",
      answer:
        "No plano básico, nosso time montou um tutorial para parametrização do sistema e está sempre pronta a te ajudar, através do nosso chat de suporte. No plano VIP, fazemos uma call de implementação individual e você tem suporte exclusivo pelo WhatsApp.",
    },
    {
      question: "Aceita API não oficial?",
      answer:
        "Sim. É possível usar API não oficial.",
    },
    {
      question: "O sistema funciona para consultórios?",
      answer:
        "Com certeza, temos um pipeline exclusivo para profissionais da saúde.",
    },
  ],
};

// ─── Final CTA ───
export const FINAL_CTA = {
  title: "Pare de queimar dinheiro por falta de resposta.",
  subtitle:
    "Todo lead que chega e não é atendido na hora certa é dinheiro que vai embora. Não para o concorrente. Direto para o lixo.",
  body: [
    "Você já investiu em tráfego, em conteúdo, em anúncio. O cliente chegou. Só que chegou no WhatsApp enquanto você estava no Instagram. Chegou no chat enquanto sua equipe estava no celular. Chegou fora do horário e não achou ninguém.",
    "Isso não é problema de esforço. É problema de estrutura.",
    "O NexIA Chat coloca todos os seus canais numa tela só, com histórico completo, pipeline visual e IA que nunca para. Seu time atende mais rápido, erra menos e fecha mais, sem precisar contratar ninguém novo para isso.",
    "Atendimento de nível corporativo não é mais privilégio de empresa grande. É o que qualquer negócio que leva a sério o próprio crescimento precisa ter agora.",
  ],
  cta: "Garantir Meu Acesso Agora",
  proof: "Mais de 15 mil leads gerados conectados com esta com API Oficial.",
};

// ─── Footer ───
export const FOOTER = {
  brand: "NexIA",
  description:
    "Elevando o padrão do atendimento conversacional no Brasil através de tecnologia de ponta e design focado no usuário.",
  copyright: "© 2026 NexIA Lab — Todos os direitos reservados.",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/nexialab.ai/" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};
