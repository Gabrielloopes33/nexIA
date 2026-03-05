/**
 * WhatsApp Business API Compliance Messages
 * Compliance notices and warnings for WhatsApp Business integration
 */

export interface ComplianceMessage {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  action?: string
  actionLink?: string
  learnMoreLink?: string
}

// ============================================
// General Compliance Messages
// ============================================

export const GENERAL_COMPLIANCE_MESSAGES: ComplianceMessage[] = [
  {
    id: 'opt-in-required',
    title: 'Consentimento Obrigatório',
    message: 'Você só pode enviar mensagens para usuários que tenham explicitamente optado por receber comunicações. Mensagens não solicitadas podem resultar em suspensão.',
    severity: 'critical',
    action: 'Ver Política de Opt-in',
    actionLink: 'https://business.whatsapp.com/policy',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in',
  },
  {
    id: 'business-verification',
    title: 'Verificação de Negócio',
    message: 'Para enviar mensagens de modelo (templates), sua empresa deve estar verificada pela Meta. Verifique o status no Business Manager.',
    severity: 'warning',
    action: 'Verificar Status',
    actionLink: 'https://business.facebook.com/settings',
    learnMoreLink: 'https://www.facebook.com/business/help/2058515294227817',
  },
  {
    id: 'message-quality',
    title: 'Qualidade das Mensagens',
    message: 'Mantenha alta qualidade nas mensagens para evitar bloqueios. Taxas altas de bloqueio ou denúncias podem resultar em restrições.',
    severity: 'warning',
    action: 'Ver Qualidade',
    actionLink: '/integracoes/whatsapp/numeros',
    learnMoreLink: 'https://www.whatsapp.com/legal/business-policy/',
  },
  {
    id: '24-hour-rule',
    title: 'Regra das 24 Horas',
    message: 'Você só pode enviar mensagens de sessão (gratuitas) dentro de uma janela de 24 horas após a última mensagem do cliente. Após isso, use templates aprovados.',
    severity: 'info',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/conversation-types',
  },
  {
    id: 'template-approval',
    title: 'Aprovação de Templates',
    message: 'Todos os templates de mensagem devem ser aprovados pela Meta antes do uso. O processo pode levar até 24 horas.',
    severity: 'info',
    action: 'Gerenciar Templates',
    actionLink: '/integracoes/whatsapp/templates',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/message-templates/guidelines',
  },
  {
    id: 'rate-limiting',
    title: 'Limites de Envio',
    message: 'Existem limites de mensagens baseados no tier da sua conta. Aumente seu tier mantendo alta qualidade e volume consistente.',
    severity: 'info',
    action: 'Ver Limites',
    actionLink: '/integracoes/whatsapp/analytics',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/messaging-limits',
  },
]

// ============================================
// Quality-Specific Messages
// ============================================

export const QUALITY_COMPLIANCE_MESSAGES: Record<string, ComplianceMessage> = {
  GREEN: {
    id: 'quality-green',
    title: 'Excelente Qualidade',
    message: 'Seu número está com qualidade alta. Continue mantendo boas práticas de comunicação para preservar este status.',
    severity: 'info',
  },
  YELLOW: {
    id: 'quality-yellow',
    title: 'Atenção à Qualidade',
    message: 'Seu número foi marcado como qualidade média. Isso pode indicar que usuários estão reportando ou bloqueando suas mensagens. Revise suas práticas de envio.',
    severity: 'warning',
    action: 'Ver Análise de Qualidade',
    actionLink: '/integracoes/whatsapp/numeros',
    learnMoreLink: 'https://www.whatsapp.com/legal/business-policy/',
  },
  RED: {
    id: 'quality-red',
    title: 'Qualidade Crítica',
    message: 'URGENTE: Seu número está com qualidade baixa. Risco imediato de bloqueio. Pare campanhas de marketing e revise imediatamente suas práticas de comunicação.',
    severity: 'critical',
    action: 'Ver Detalhes',
    actionLink: '/integracoes/whatsapp/numeros',
    learnMoreLink: 'https://business.whatsapp.com/policy',
  },
  UNKNOWN: {
    id: 'quality-unknown',
    title: 'Qualidade Desconhecida',
    message: 'Não foi possível determinar a qualidade deste número. Entre em contato com o suporte se o problema persistir.',
    severity: 'info',
  },
}

// ============================================
// Template Compliance Messages
// ============================================

export const TEMPLATE_COMPLIANCE_MESSAGES: Record<string, ComplianceMessage> = {
  APPROVED: {
    id: 'template-approved',
    title: 'Template Aprovado',
    message: 'Este template foi aprovado e pode ser usado para enviar mensagens.',
    severity: 'info',
  },
  PENDING: {
    id: 'template-pending',
    title: 'Template em Análise',
    message: 'Este template está sendo revisado pela Meta. O processo pode levar até 24 horas.',
    severity: 'info',
  },
  REJECTED: {
    id: 'template-rejected',
    title: 'Template Rejeitado',
    message: 'Este template não atende às diretrizes da Meta. Revise o motivo da rejeição e ajuste conforme necessário.',
    severity: 'warning',
    action: 'Ver Diretrizes',
    actionLink: 'https://developers.facebook.com/docs/whatsapp/message-templates/guidelines',
    learnMoreLink: 'https://business.whatsapp.com/policy',
  },
  PAUSED: {
    id: 'template-paused',
    title: 'Template Pausado',
    message: 'Este template foi pausado por violação de política ou baixa qualidade. Não pode ser usado até ser revisado.',
    severity: 'critical',
    action: 'Entrar em Contato',
    actionLink: 'https://business.facebook.com/support',
  },
  FLAGGED: {
    id: 'template-flagged',
    title: 'Template Sinalizado',
    message: 'Este template foi sinalizado para revisão. Pode continuar sendo usado, mas monitore de perto.',
    severity: 'warning',
  },
}

// ============================================
// Connection Status Messages
// ============================================

export const CONNECTION_COMPLIANCE_MESSAGES: Record<string, ComplianceMessage> = {
  not_connected: {
    id: 'not-connected',
    title: 'Conexão Necessária',
    message: 'Conecte sua conta WhatsApp Business usando o Embedded Signup da Meta para começar a usar a API.',
    severity: 'info',
    action: 'Conectar Agora',
    actionLink: '/integracoes/whatsapp/connect',
  },
  token_expired: {
    id: 'token-expired',
    title: 'Token Expirado',
    message: 'Seu token de acesso expirou. Reautentique sua conta para restaurar a conexão.',
    severity: 'warning',
    action: 'Reconectar',
    actionLink: '/integracoes/whatsapp/connect',
  },
  error: {
    id: 'connection-error',
    title: 'Erro de Conexão',
    message: 'Ocorreu um erro na conexão com a API do WhatsApp. Verifique suas credenciais e tente novamente.',
    severity: 'warning',
    action: 'Verificar Configurações',
    actionLink: '/integracoes/whatsapp/connect',
  },
}

// ============================================
// Webhook Compliance Messages
// ============================================

export const WEBHOOK_COMPLIANCE_MESSAGES: ComplianceMessage[] = [
  {
    id: 'webhook-security',
    title: 'Segurança do Webhook',
    message: 'Sempre valide a assinatura do webhook usando o token de verificação para garantir que os eventos são realmente da Meta.',
    severity: 'warning',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/webhooks/set-up',
  },
  {
    id: 'webhook-https',
    title: 'HTTPS Obrigatório',
    message: 'A URL do webhook deve usar HTTPS. URLs HTTP não são aceitas por questões de segurança.',
    severity: 'critical',
  },
  {
    id: 'webhook-response',
    title: 'Resposta Rápida do Webhook',
    message: 'Seu endpoint deve responder com código 200 em menos de 20 segundos. Caso contrário, a Meta tentará reenviar o evento.',
    severity: 'info',
    learnMoreLink: 'https://developers.facebook.com/docs/whatsapp/webhooks/set-up',
  },
]

// ============================================
// Policy Violation Messages
// ============================================

export const POLICY_VIOLATION_MESSAGES: Record<string, ComplianceMessage> = {
  spam: {
    id: 'violation-spam',
    title: 'Violação: Spam',
    message: 'Sua conta foi sinalizada por envio de spam. Evite enviar mensagens não solicitadas ou em volume excessivo.',
    severity: 'critical',
    action: 'Ver Política',
    actionLink: 'https://www.whatsapp.com/legal/business-policy/',
  },
  inappropriate_content: {
    id: 'violation-content',
    title: 'Violação: Conteúdo Inapropriado',
    message: 'Conteúdo que viola as diretrizes da comunidade foi detectado. Revise o conteúdo de suas mensagens.',
    severity: 'critical',
    action: 'Ver Diretrizes',
    actionLink: 'https://www.whatsapp.com/legal/business-policy/',
  },
  phishing: {
    id: 'violation-phishing',
    title: 'Violação: Phishing',
    message: 'Tentativas de phishing ou fraude foram detectadas. Isto é uma violação grave e pode resultar em banimento permanente.',
    severity: 'critical',
    action: 'Entrar em Contato',
    actionLink: 'https://business.facebook.com/support',
  },
}

// ============================================
// Helper Functions
// ============================================

export function getComplianceMessageById(id: string): ComplianceMessage | undefined {
  const allMessages = [
    ...GENERAL_COMPLIANCE_MESSAGES,
    ...Object.values(QUALITY_COMPLIANCE_MESSAGES),
    ...Object.values(TEMPLATE_COMPLIANCE_MESSAGES),
    ...Object.values(CONNECTION_COMPLIANCE_MESSAGES),
    ...WEBHOOK_COMPLIANCE_MESSAGES,
    ...Object.values(POLICY_VIOLATION_MESSAGES),
  ]
  return allMessages.find((msg) => msg.id === id)
}

export function getComplianceMessagesBySeverity(severity: 'info' | 'warning' | 'critical'): ComplianceMessage[] {
  const allMessages = [
    ...GENERAL_COMPLIANCE_MESSAGES,
    ...Object.values(QUALITY_COMPLIANCE_MESSAGES),
    ...Object.values(TEMPLATE_COMPLIANCE_MESSAGES),
    ...Object.values(CONNECTION_COMPLIANCE_MESSAGES),
    ...WEBHOOK_COMPLIANCE_MESSAGES,
    ...Object.values(POLICY_VIOLATION_MESSAGES),
  ]
  return allMessages.filter((msg) => msg.severity === severity)
}
