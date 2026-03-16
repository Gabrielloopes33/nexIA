/**
 * Tipagens para integração com Plano de Ação
 * Feature: Typebot → Plano de Ação → CRM NexIA
 */

import { PendingFormDeliveryStatus } from "@prisma/client";

// ============================================
// Payloads de Entrada (do Plano de Ação)
// ============================================

/**
 * Dados do lead recebidos do Plano de Ação
 */
export interface LeadData {
  nome: string;
  email?: string;
  telefone: string;
}

/**
 * Payload principal recebido no webhook de formulário
 * Enviado pelo sistema plano-de-acao-lancamento
 */
export interface FormSubmissionPayload {
  /** Secret compartilhado para autenticação */
  secret: string;
  /** ID da organização no CRM NexIA */
  organizationId: string;
  /** ID da instância WhatsApp no CRM NexIA */
  instanceId: string;
  /** Nome do template a ser enviado */
  templateName: string;
  /** Idioma do template (default: pt_BR) */
  templateLanguage?: string;
  /** Variáveis para o template */
  templateVariables: string[];
  /** Dados do lead */
  leadData: LeadData;
  /** URL pública do PDF gerado */
  pdfUrl: string;
  /** Nome do arquivo PDF */
  pdfFilename: string;
  /** ID do dossié no plano-de-acao */
  dossieId: string;
  /** ID do aluno no plano-de-acao */
  alunoId: string;
  /** Origem do formulário */
  source: "typebot";
  /** Timestamp do envio */
  timestamp: string;
}

// ============================================
// Respostas da API
// ============================================

/**
 * Resposta de sucesso ao receber webhook
 */
export interface FormSubmissionSuccessResponse {
  success: true;
  data: {
    contactId: string;
    conversationId: string;
    templateMessageId: string;
    pendingDeliveryId: string;
    status: PendingFormDeliveryStatus;
  };
}

/**
 * Resposta de erro da API
 */
export interface FormSubmissionErrorResponse {
  success: false;
  error: string;
  errorCode?: FormSubmissionErrorCode;
}

/**
 * Códigos de erro específicos
 */
export type FormSubmissionErrorCode =
  | "INVALID_SECRET"
  | "INVALID_PAYLOAD"
  | "ORGANIZATION_NOT_FOUND"
  | "INSTANCE_NOT_FOUND"
  | "TEMPLATE_NOT_FOUND"
  | "TEMPLATE_NOT_APPROVED"
  | "PHONE_INVALID"
  | "RATE_LIMIT_EXCEEDED"
  | "PDF_DOWNLOAD_FAILED"
  | "META_API_ERROR"
  | "INTERNAL_ERROR";

// ============================================
// Processamento de Entrega
// ============================================

/**
 * Configurações de retry
 */
export interface DeliveryRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Estado do processamento de entrega
 */
export interface DeliveryProcessingState {
  pendingDeliveryId: string;
  status: PendingFormDeliveryStatus;
  retryCount: number;
  pdfDownloaded: boolean;
  pdfUploaded: boolean;
  mediaId?: string;
  errorMessage?: string;
}

/**
 * Resultado do processamento
 */
export interface DeliveryProcessingResult {
  success: boolean;
  pendingDeliveryId: string;
  newStatus: PendingFormDeliveryStatus;
  messageId?: string;
  error?: string;
}

// ============================================
// Estatísticas (Dashboard)
// ============================================

/**
 * Estatísticas gerais de entregas
 */
export interface FormSubmissionStats {
  totalToday: number;
  successRate: number;
  pendingCount: number;
  failedLast24h: number;
}

/**
 * Estatísticas detalhadas por período
 */
export interface FormSubmissionDetailedStats {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    expired: number;
    cancelled: number;
  };
  byOrganization: Array<{
    organizationId: string;
    organizationName: string;
    total: number;
    completed: number;
    failed: number;
  }>;
  byStatus: Record<PendingFormDeliveryStatus, number>;
  timeline: Array<{
    date: string;
    count: number;
    status: PendingFormDeliveryStatus;
  }>;
}

// ============================================
// Interface de Gerenciamento
// ============================================

/**
 * Filtros para listagem de entregas pendentes
 */
export interface PendingDeliveriesFilter {
  organizationId?: string;
  status?: PendingFormDeliveryStatus;
  startDate?: string;
  endDate?: string;
  phone?: string;
  leadName?: string;
}

/**
 * Item da lista de entregas pendentes
 */
export interface PendingDeliveryListItem {
  id: string;
  messageId: string;
  phone: string;
  leadName: string | null;
  leadEmail: string | null;
  organizationId: string;
  organizationName: string;
  templateName: string;
  status: PendingFormDeliveryStatus;
  retryCount: number;
  pdfFilename: string;
  dossieId: string | null;
  createdAt: string;
  expiresAt: string;
  isCancelled: boolean;
}

/**
 * Item do histórico de entregas
 */
export interface DeliveryHistoryItem extends PendingDeliveryListItem {
  completedAt: string | null;
  errorMessage: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
}

/**
 * Detalhes completos de uma entrega
 */
export interface DeliveryDetails extends DeliveryHistoryItem {
  instanceId: string;
  instanceName: string;
  pdfUrl: string;
  mediaId: string | null;
  templateLanguage: string;
  templateVariables: string[];
  alunoId: string | null;
  reprocessedFrom: string | null;
  lastErrorAt: string | null;
}

// ============================================
// Ações de Gerenciamento
// ============================================

/**
 * Requisição para reprocessar entrega
 */
export interface ReprocessDeliveryRequest {
  /** ID da entrega a ser reprocessada */
  deliveryId: string;
  /** ID do usuário que está reprocessando */
  userId?: string;
}

/**
 * Resposta do reprocessamento
 */
export interface ReprocessDeliveryResponse {
  success: boolean;
  message: string;
  newDeliveryId?: string;
}

/**
 * Requisição para cancelar entrega
 */
export interface CancelDeliveryRequest {
  /** ID da entrega a ser cancelada */
  deliveryId: string;
  /** ID do usuário que está cancelando */
  userId: string;
  /** Motivo do cancelamento (opcional) */
  reason?: string;
}

/**
 * Resposta do cancelamento
 */
export interface CancelDeliveryResponse {
  success: boolean;
  message: string;
}

// ============================================
// Configurações
// ============================================

/**
 * Configurações do sistema de formulários
 */
export interface FormSubmissionSettings {
  /** Templates padrão por organização */
  defaultTemplates: Record<string, string>;
  /** Retry automático habilitado */
  autoRetryEnabled: boolean;
  /** Configuração de retry */
  retryConfig: DeliveryRetryConfig;
  /** Timeout para download de PDF (ms) */
  pdfDownloadTimeoutMs: number;
  /** Tamanho máximo de PDF (MB) */
  maxPdfSizeMb: number;
  /** Tempo de expiração (horas) */
  expiryHours: number;
}

/**
 * Requisição para atualizar configurações
 */
export interface UpdateSettingsRequest {
  autoRetryEnabled?: boolean;
  pdfDownloadTimeoutMs?: number;
  maxPdfSizeMb?: number;
  expiryHours?: number;
}
