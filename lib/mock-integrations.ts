import type { Integration, ActivityLog } from './types/integration';

/**
 * Mock Integration Data
 * Realistic data for demonstration purposes
 */

export const MOCK_INTEGRATIONS_DATA: Integration[] = [
  {
    id: '1',
    name: 'WhatsApp Business',
    slug: 'whatsapp',
    description: 'Conecte sua conta do WhatsApp Business para enviar e receber mensagens diretamente no CRM',
    logo: '/integrations/whatsapp.svg',
    color: '#25D366',
    category: 'communication',
    authMethod: 'api_key',
    status: 'connected',
    features: ['Mensagens', 'Mídia', 'Templates', 'Webhooks'],
    messagesCount: 1247,
    lastSyncAt: new Date('2026-02-26T10:30:00'),
    healthScore: 98,
    popular: false,
    verified: true,
    connectedAt: new Date('2026-01-15'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-26T10:30:00'),
    settings: {
      enabled: true,
      autoSync: true,
      syncFrequency: 'realtime',
      notifyOnError: true,
    }
  },
  {
    id: '2',
    name: 'Instagram Messaging',
    slug: 'instagram',
    description: 'Gerencie mensagens diretas da sua conta comercial do Instagram em um só lugar',
    logo: '/integrations/instagram.svg',
    color: '#E4405F',
    category: 'communication',
    authMethod: 'oauth',
    status: 'connected',
    features: ['DMs', 'Stories', 'Comentários', '@Mentions'],
    messagesCount: 843,
    lastSyncAt: new Date('2026-02-26T10:25:00'),
    healthScore: 95,
    popular: false,
    verified: true,
    connectedAt: new Date('2026-01-20'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-26T10:25:00'),
    settings: {
      enabled: true,
      autoSync: true,
      syncFrequency: 'realtime',
      notifyOnError: true,
    }
  },
  {
    id: '3',
    name: 'Hotmart',
    slug: 'hotmart',
    description: 'Sincronize vendas e assinaturas de produtos digitais automaticamente via webhook',
    logo: '/integrations/hotmart.svg',
    color: '#FF6700',
    category: 'infoproduct',
    authMethod: 'webhook',
    status: 'connected',
    features: ['Vendas', 'Reembolsos', 'Assinaturas', 'Webhooks'],
    messagesCount: 324,
    lastSyncAt: new Date('2026-02-26T09:45:00'),
    healthScore: 100,
    popular: false,
    verified: true,
    connectedAt: new Date('2026-02-01'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-26T09:45:00'),
    settings: {
      enabled: true,
      autoSync: true,
      syncFrequency: 'realtime',
      notifyOnError: true,
      webhookUrl: 'https://yourcrm.com/webhooks/hotmart/abc123',
      secretKey: 'sk_live_abc123xyz789',
    }
  },
  {
    id: '5',
    name: 'Chat Widget',
    slug: 'chat-widget',
    description: 'Widget de chat ao vivo para seu website com customização completa',
    logo: '/integrations/chat.svg',
    color: '#7C3AED',
    category: 'communication',
    authMethod: 'api_key',
    status: 'connected',
    features: ['Tempo Real', 'Customizável', 'Offline Mode', 'Mobile'],
    messagesCount: 567,
    lastSyncAt: new Date('2026-02-26T10:35:00'),
    healthScore: 100,
    popular: false,
    verified: true,
    connectedAt: new Date('2026-02-05'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-26T10:35:00'),
    settings: {
      enabled: true,
      autoSync: true,
      syncFrequency: 'realtime',
      notifyOnError: true,
    }
  },
];

export const MOCK_ACTIVITY_LOGS_DATA: ActivityLog[] = [
  {
    id: 'log-1',
    integrationId: '1',
    integrationName: 'WhatsApp Business',
    timestamp: new Date('2026-02-26T10:30:15'),
    event: 'message_received',
    status: 'success',
    details: 'Mensagem recebida de +55 11 99999-9999',
    metadata: { phone: '+5511999999999', messageId: 'msg_abc123' }
  },
  {
    id: 'log-2',
    integrationId: '1',
    integrationName: 'WhatsApp Business',
    timestamp: new Date('2026-02-26T10:28:00'),
    event: 'sync_complete',
    status: 'success',
    details: 'Sincronização concluída: 12 novas mensagens',
    metadata: { messagesCount: 12 }
  },
  {
    id: 'log-3',
    integrationId: '2',
    integrationName: 'Instagram Messaging',
    timestamp: new Date('2026-02-26T10:25:30'),
    event: 'message_received',
    status: 'success',
    details: 'DM recebida de @usuario_instagram',
    metadata: { username: '@usuario_instagram' }
  },
  {
    id: 'log-4',
    integrationId: '3',
    integrationName: 'Hotmart',
    timestamp: new Date('2026-02-26T09:45:12'),
    event: 'webhook_received',
    status: 'success',
    details: 'Venda recebida: Curso de Marketing Digital - R$ 197,00',
    metadata: { transaction: 'HP123456789', value: 197.00, product: 'Curso de Marketing Digital' }
  },
  {
    id: 'log-5',
    integrationId: '3',
    integrationName: 'Hotmart',
    timestamp: new Date('2026-02-26T08:30:00'),
    event: 'webhook_received',
    status: 'success',
    details: 'Assinatura cancelada: Plano Premium Mensal',
    metadata: { subscription: 'SUB98765', plan: 'Premium Mensal' }
  },
  {
    id: 'log-6',
    integrationId: '5',
    integrationName: 'Chat Widget',
    timestamp: new Date('2026-02-26T10:35:00'),
    event: 'message_received',
    status: 'success',
    details: 'Nova conversa iniciada via website',
    metadata: { sessionId: 'session_xyz789' }
  },
  {
    id: 'log-7',
    integrationId: '1',
    integrationName: 'WhatsApp Business',
    timestamp: new Date('2026-02-26T09:15:00'),
    event: 'message_sent',
    status: 'success',
    details: 'Mensagem enviada com sucesso para +55 11 98888-8888',
    metadata: { phone: '+5511988888888', messageId: 'msg_def456' }
  },
  {
    id: 'log-8',
    integrationId: '2',
    integrationName: 'Instagram Messaging',
    timestamp: new Date('2026-02-26T09:00:00'),
    event: 'webhook_received',
    status: 'success',
    details: 'Comentário em post: "Adorei o conteúdo!"',
    metadata: { postId: 'post_123', username: '@fan_profile' }
  },
  {
    id: 'log-9',
    integrationId: '3',
    integrationName: 'Hotmart',
    timestamp: new Date('2026-02-25T16:20:00'),
    event: 'webhook_received',
    status: 'success',
    details: 'Reembolso processado: Curso de Excel - R$ 97,00',
    metadata: { transaction: 'HP987654321', value: 97.00, type: 'refund' }
  },
  {
    id: 'log-10',
    integrationId: '1',
    integrationName: 'WhatsApp Business',
    timestamp: new Date('2026-02-25T14:30:00'),
    event: 'connection_test',
    status: 'success',
    details: 'Teste de conexão bem-sucedido',
    metadata: {}
  },
  {
    id: 'log-11',
    integrationId: '5',
    integrationName: 'Chat Widget',
    timestamp: new Date('2026-02-25T11:00:00'),
    event: 'status_change',
    status: 'success',
    details: 'Widget ativado no website',
    metadata: { previousStatus: 'paused', newStatus: 'active' }
  },
  {
    id: 'log-12',
    integrationId: '2',
    integrationName: 'Instagram Messaging',
    timestamp: new Date('2026-02-25T10:30:00'),
    event: 'webhook_received',
    status: 'success',
    details: 'Comentário em post: "Adorei o conteúdo!"',
    metadata: { postId: 'post_123', username: '@fan_profile' }
  },
];
