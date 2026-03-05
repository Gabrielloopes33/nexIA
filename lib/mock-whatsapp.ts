/**
 * WhatsApp Business API Mock Data
 * Dados mock realistas para a empresa "NexIA"
 */

import type {
  WhatsAppPhoneNumber,
  WhatsAppTemplate,
  WhatsAppWebhookConfig,
  WhatsAppBusinessAccount,
  WhatsAppConnectionStatus,
  WhatsAppAnalytics,
  WhatsAppCompliance,
  WhatsAppConversation,
} from './types/whatsapp';

// ============================================
// Mock Phone Numbers
// ============================================

export const MOCK_WHATSAPP_PHONE_NUMBERS: WhatsAppPhoneNumber[] = [
  {
    id: 'wp-phone-001',
    displayName: 'NexIA - Suporte Principal',
    phoneNumber: '+5511987654321',
    countryCode: 'BR',
    status: 'verified',
    qualityRating: 'GREEN',
    messagingLimit: 'TIER_3',
    qualityScore: {
      date: new Date('2026-02-28'),
      score: 95,
    },
    defaultLanguage: 'pt_BR',
    businessName: 'NexIA Soluções Inteligentes',
    businessDescription: 'Plataforma de CRM e automação para empresas',
    verifiedAt: new Date('2025-11-15'),
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: 'wp-phone-002',
    displayName: 'NexIA - Vendas',
    phoneNumber: '+5511976543210',
    countryCode: 'BR',
    status: 'verified',
    qualityRating: 'GREEN',
    messagingLimit: 'TIER_2',
    qualityScore: {
      date: new Date('2026-02-27'),
      score: 88,
    },
    defaultLanguage: 'pt_BR',
    businessName: 'NexIA Vendas',
    businessDescription: 'Time comercial NexIA',
    verifiedAt: new Date('2025-12-20'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-27'),
  },
  {
    id: 'wp-phone-003',
    displayName: 'NexIA - Marketing',
    phoneNumber: '+5511965432109',
    countryCode: 'BR',
    status: 'pending',
    qualityRating: 'NA',
    messagingLimit: 'TIER_1',
    defaultLanguage: 'pt_BR',
    businessName: 'NexIA Marketing',
    businessDescription: 'Campanhas e comunicações de marketing',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-28'),
  },
];

// ============================================
// Mock Templates
// ============================================

export const MOCK_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // Categoria: MARKETING
  {
    id: 'tmpl-001',
    name: 'boas_vindas_nexia',
    category: 'MARKETING',
    language: 'pt_BR',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Bem-vindo à NexIA, {{1}}! 🚀',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nÉ um prazer ter você conosco! Você acaba de dar o primeiro passo para transformar a gestão do seu negócio.\n\nNossa equipe está pronta para ajudar você a alcançar resultados incríveis.\n\nQualquer dúvida, estamos à disposição!',
        example: {
          body_text: [['João Silva']],
        },
      },
      {
        type: 'FOOTER',
        text: 'NexIA - Inteligência que impulsiona resultados',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Acessar Plataforma',
            url: 'https://nexia.com.br/login',
          },
          {
            type: 'QUICK_REPLY',
            text: 'Falar com Especialista',
          },
        ],
      },
    ],
    stats: {
      sentCount: 1250,
      deliveredCount: 1187,
      readCount: 892,
      clickedCount: 456,
    },
    submittedAt: new Date('2025-11-01'),
    approvedAt: new Date('2025-11-02'),
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: 'tmpl-002',
    name: 'promocao_lancamento',
    category: 'MARKETING',
    language: 'pt_BR',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🎉 Oferta Especial para Você!',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nTemos uma novidade incrível! O {{2}} está com {{3}}% de desconto por tempo limitado.\n\n✅ Acesso vitalício\n✅ Suporte premium\n✅ Certificado incluso\n\nAproveite agora e leve sua carreira ao próximo nível!',
        example: {
          body_text: [['Maria Santos', 'Curso de Automação', '30']],
        },
      },
      {
        type: 'FOOTER',
        text: 'Promoção válida até {{1}}',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Quero Aproveitar',
            url: 'https://nexia.com.br/promo/{{1}}',
            example: ['ABC123'],
          },
        ],
      },
    ],
    stats: {
      sentCount: 3420,
      deliveredCount: 3215,
      readCount: 2568,
      clickedCount: 1234,
    },
    submittedAt: new Date('2026-01-10'),
    approvedAt: new Date('2026-01-11'),
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-02-28'),
  },
  // Categoria: UTILITY
  {
    id: 'tmpl-003',
    name: 'confirmacao_agendamento',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '✅ Consulta Confirmada',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nSua consulta foi confirmada com sucesso!\n\n📅 Data: {{2}}\n⏰ Horário: {{3}}\n👨‍⚕️ Profissional: {{4}}\n📍 Local: {{5}}\n\nCaso precise reagendar, entre em contato conosco.',
        example: {
          body_text: [['Carlos Oliveira', '15/03/2026', '14:30', 'Dr. Silva', 'Av. Paulista, 1000']],
        },
      },
      {
        type: 'FOOTER',
        text: 'NexIA - Organizando seu tempo',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Confirmar Presença',
          },
          {
            type: 'QUICK_REPLY',
            text: 'Reagendar',
          },
        ],
      },
    ],
    stats: {
      sentCount: 5670,
      deliveredCount: 5490,
      readCount: 4980,
      clickedCount: 2340,
    },
    submittedAt: new Date('2025-12-05'),
    approvedAt: new Date('2025-12-06'),
    createdAt: new Date('2025-12-05'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: 'tmpl-004',
    name: 'notificacao_pagamento',
    category: 'UTILITY',
    language: 'pt_BR',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '💳 Pagamento Recebido',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nRecebemos seu pagamento no valor de {{2}} referente à {{3}}.\n\n📋 Transação: {{4}}\n📅 Data: {{5}}\n✅ Status: Aprovado\n\nObrigado pela preferência!',
        example: {
          body_text: [['Ana Paula', 'R$ 297,00', 'Assinatura Mensal', 'TXN123456', '28/02/2026']],
        },
      },
      {
        type: 'FOOTER',
        text: 'NexIA - Gestão simplificada',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Ver Comprovante',
            url: 'https://nexia.com.br/receipt/{{1}}',
            example: ['TXN123456'],
          },
        ],
      },
    ],
    stats: {
      sentCount: 8230,
      deliveredCount: 8150,
      readCount: 7620,
      clickedCount: 3450,
    },
    submittedAt: new Date('2025-11-20'),
    approvedAt: new Date('2025-11-21'),
    createdAt: new Date('2025-11-20'),
    updatedAt: new Date('2026-02-28'),
  },
  // Categoria: AUTHENTICATION
  {
    id: 'tmpl-005',
    name: 'codigo_verificacao',
    category: 'AUTHENTICATION',
    language: 'pt_BR',
    status: 'APPROVED',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🔐 Código de Verificação',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nSeu código de verificação para acesso à plataforma NexIA é:\n\n*{{2}}*\n\nEste código expira em {{3}} minutos. Não compartilhe com ninguém.\n\nSe você não solicitou este código, ignore esta mensagem.',
        example: {
          body_text: [['Pedro Costa', '123456', '10']],
        },
      },
      {
        type: 'FOOTER',
        text: 'Equipe de Segurança NexIA',
      },
    ],
    stats: {
      sentCount: 15600,
      deliveredCount: 15420,
      readCount: 15200,
      clickedCount: 0,
    },
    submittedAt: new Date('2025-10-15'),
    approvedAt: new Date('2025-10-16'),
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2026-02-28'),
  },
  {
    id: 'tmpl-006',
    name: 'alerta_seguranca',
    category: 'AUTHENTICATION',
    language: 'pt_BR',
    status: 'PENDING',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '⚠️ Acesso Detectado',
      },
      {
        type: 'BODY',
        text: 'Olá {{1}},\n\nDetectamos um novo acesso à sua conta NexIA:\n\n📱 Dispositivo: {{2}}\n🌐 Navegador: {{3}}\n📍 Localização: {{4}}\n📅 Data/Hora: {{5}}\n\nSe foi você, pode ignorar esta mensagem. Caso contrário, recomendamos alterar sua senha imediatamente.',
        example: {
          body_text: [['Fernanda Lima', 'iPhone 15', 'Safari', 'São Paulo, SP', '28/02/2026 10:30']],
        },
      },
      {
        type: 'FOOTER',
        text: 'Segurança NexIA',
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'Alterar Senha',
            url: 'https://nexia.com.br/security/reset',
          },
        ],
      },
    ],
    submittedAt: new Date('2026-02-25'),
    createdAt: new Date('2026-02-25'),
    updatedAt: new Date('2026-02-28'),
  },
];

// ============================================
// Mock Webhook Configuration
// ============================================

export const MOCK_WHATSAPP_WEBHOOK_CONFIG: WhatsAppWebhookConfig = {
  id: 'wh-config-001',
  url: 'https://api.nexia.com.br/webhooks/whatsapp',
  verifyToken: 'nexia_verify_token_2026',
  secretKey: 'whsec_nexia_webhook_signature_key_a1b2c3d4',
  subscribedEvents: [
    'messages',
    'message_template_status_update',
    'messaging_opt_ins',
    'messaging_opt_outs',
    'messaging_deliveries',
    'messaging_reads',
  ],
  signatureValidation: true,
  retryAttempts: 3,
  status: 'active',
  lastSuccessAt: new Date('2026-02-28T10:30:00'),
  includeMessageContent: true,
  createdAt: new Date('2025-11-01'),
  updatedAt: new Date('2026-02-28'),
};

// ============================================
// Mock Business Account
// ============================================

export const MOCK_WHATSAPP_BUSINESS_ACCOUNT: WhatsAppBusinessAccount = {
  id: 'waba-001',
  name: 'NexIA - Conta Principal',
  accountId: '123456789012345',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  status: 'connected' as WhatsAppConnectionStatus,
  isVerified: true,
  dailySpendingLimit: 1000000,    // R$ 10.000,00 em centavos
  currentSpending: 28750,         // R$ 287,50 em centavos
  phoneNumbers: MOCK_WHATSAPP_PHONE_NUMBERS,
  templates: MOCK_WHATSAPP_TEMPLATES,
  webhook: MOCK_WHATSAPP_WEBHOOK_CONFIG,
  createdAt: new Date('2025-10-01'),
  updatedAt: new Date('2026-02-28'),
};

// ============================================
// Mock Analytics
// ============================================

export const MOCK_WHATSAPP_ANALYTICS: WhatsAppAnalytics = {
  period: {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-28'),
    granularity: 'month',
  },
  totalMessages: {
    sent: 45230,
    delivered: 44120,
    read: 38950,
    failed: 315,
  },
  messagesByType: {
    session: 28450,
    template: 16780,
    broadcast: 0,
  },
  spending: {
    total: 28750,                 // R$ 287,50
    byCategory: {
      marketing: 12500,           // R$ 125,00
      utility: 9875,              // R$ 98,75
      authentication: 6375,       // R$ 63,75
      service: 0,                 // Incluído no session
    },
  },
  conversations: {
    total: 8230,
    active: 245,
    initiatedBy: {
      business: 4560,
      user: 3670,
    },
    duration: {
      average: 18.5,              // 18.5 minutos
    },
  },
  rates: {
    deliveryRate: 97.5,
    readRate: 88.3,
    responseRate: 62.4,
    optOutRate: 0.8,
  },
  qualityMetrics: {
    qualityScore: 92,
    blocks: 12,
    spamReports: 3,
  },
};

// ============================================
// Mock Compliance Records
// ============================================

export const MOCK_WHATSAPP_COMPLIANCE: WhatsAppCompliance[] = [
  {
    id: 'comp-001',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511999999991',
    status: 'opted_in',
    optInRequired: true,
    consentDate: new Date('2026-02-15T10:30:00'),
    consentMethod: 'web_form',
    consentSource: 'Landing Page - Newsletter',
    consentProof: 'https://nexia.com.br/consent/proof/comp-001',
    consentMessage: 'Aceito receber comunicações da NexIA sobre novidades, promoções e conteúdos relevantes.',
    expiresAt: new Date('2027-02-15'),
    ipAddress: '187.45.123.89',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date('2026-02-15T10:30:00'),
    updatedAt: new Date('2026-02-15T10:30:00'),
  },
  {
    id: 'comp-002',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511988888882',
    status: 'opted_in',
    optInRequired: true,
    consentDate: new Date('2026-01-20T14:15:00'),
    consentMethod: 'widget',
    consentSource: 'Chat Widget - Site Principal',
    consentProof: 'https://nexia.com.br/consent/proof/comp-002',
    consentMessage: 'Desejo receber atualizações sobre meus atendimentos e novidades da NexIA.',
    expiresAt: new Date('2027-01-20'),
    ipAddress: '201.11.234.56',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    createdAt: new Date('2026-01-20T14:15:00'),
    updatedAt: new Date('2026-01-20T14:15:00'),
  },
  {
    id: 'comp-003',
    phoneNumberId: 'wp-phone-002',
    customerPhone: '+5511977777773',
    status: 'opted_out',
    optInRequired: true,
    consentDate: new Date('2025-12-10T09:00:00'),
    consentMethod: 'web_form',
    consentSource: 'Checkout - Compra Curso',
    optedOutAt: new Date('2026-02-10T16:45:00'),
    optOutReason: 'Não desejo mais receber mensagens',
    createdAt: new Date('2025-12-10T09:00:00'),
    updatedAt: new Date('2026-02-10T16:45:00'),
  },
  {
    id: 'comp-004',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511966666664',
    status: 'expired',
    optInRequired: true,
    consentDate: new Date('2024-12-01T11:00:00'),
    consentMethod: 'sms',
    consentSource: 'Campanha SMS Natal 2024',
    consentProof: 'SMS-LOG-20241201-00456',
    consentMessage: 'Responda SIM para receber ofertas exclusivas da NexIA.',
    expiresAt: new Date('2025-12-01'),
    createdAt: new Date('2024-12-01T11:00:00'),
    updatedAt: new Date('2025-12-01T00:00:00'),
  },
  {
    id: 'comp-005',
    phoneNumberId: 'wp-phone-002',
    customerPhone: '+5511955555555',
    status: 'opted_in',
    optInRequired: false,         // Conversa iniciada pelo cliente
    consentDate: new Date('2026-02-20T08:30:00'),
    consentMethod: 'whatsapp_cta',
    consentSource: 'Iniciativa do Cliente',
    consentMessage: 'Cliente iniciou conversa via WhatsApp',
    createdAt: new Date('2026-02-20T08:30:00'),
    updatedAt: new Date('2026-02-20T08:30:00'),
  },
  {
    id: 'comp-006',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511944444446',
    status: 'pending',
    optInRequired: true,
    consentMethod: 'qr_code',
    consentSource: 'QR Code - Evento Tech Summit 2026',
    consentMessage: 'Escaneie para receber materiais exclusivos do evento.',
    createdAt: new Date('2026-02-28T09:00:00'),
    updatedAt: new Date('2026-02-28T09:00:00'),
  },
];

// ============================================
// Mock Conversations
// ============================================

export const MOCK_WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: 'conv-001',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511999999991',
    customerName: 'Roberto Almeida',
    status: 'active',
    messageCount: 24,
    lastMessageAt: new Date('2026-02-28T10:25:00'),
    lastMessageBy: 'customer',
    category: 'SERVICE',
    sessionWindow: {
      startedAt: new Date('2026-02-28T09:30:00'),
      expiresAt: new Date('2026-02-29T09:30:00'),
      isOpen: true,
    },
    createdAt: new Date('2026-02-15T10:35:00'),
    updatedAt: new Date('2026-02-28T10:25:00'),
  },
  {
    id: 'conv-002',
    phoneNumberId: 'wp-phone-001',
    customerPhone: '+5511988888882',
    customerName: 'Mariana Costa',
    status: 'active',
    messageCount: 8,
    lastMessageAt: new Date('2026-02-28T10:15:00'),
    lastMessageBy: 'business',
    category: 'UTILITY',
    sessionWindow: {
      startedAt: new Date('2026-02-28T10:00:00'),
      expiresAt: new Date('2026-03-01T10:00:00'),
      isOpen: true,
    },
    createdAt: new Date('2026-02-28T10:00:00'),
    updatedAt: new Date('2026-02-28T10:15:00'),
  },
  {
    id: 'conv-003',
    phoneNumberId: 'wp-phone-002',
    customerPhone: '+5511977777773',
    customerName: 'Juliana Ferreira',
    status: 'closed',
    messageCount: 15,
    lastMessageAt: new Date('2026-02-27T18:00:00'),
    lastMessageBy: 'business',
    category: 'MARKETING',
    sessionWindow: {
      startedAt: new Date('2026-02-27T14:00:00'),
      expiresAt: new Date('2026-02-28T14:00:00'),
      isOpen: false,
    },
    createdAt: new Date('2026-02-20T09:00:00'),
    updatedAt: new Date('2026-02-27T18:00:00'),
  },
];

// ============================================
// Export All Mock Data
// ============================================

export const MOCK_WHATSAPP_DATA = {
  businessAccount: MOCK_WHATSAPP_BUSINESS_ACCOUNT,
  phoneNumbers: MOCK_WHATSAPP_PHONE_NUMBERS,
  templates: MOCK_WHATSAPP_TEMPLATES,
  webhookConfig: MOCK_WHATSAPP_WEBHOOK_CONFIG,
  analytics: MOCK_WHATSAPP_ANALYTICS,
  compliance: MOCK_WHATSAPP_COMPLIANCE,
  conversations: MOCK_WHATSAPP_CONVERSATIONS,
} as const;

export default MOCK_WHATSAPP_DATA;
