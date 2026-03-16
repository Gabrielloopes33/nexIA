/**
 * Processador de entrega de formulários
 * Responsável por enviar o PDF após receber confirmação de entrega do template
 */

import { PendingFormDelivery, PendingFormDeliveryStatus, WhatsAppInstance } from "@prisma/client";
import { prisma } from "@/lib/db";
import { downloadPdf } from "./pdf-downloader";
import { uploadPdf } from "./media-upload";
import { sendDocumentMessage } from "./cloud-api";

export interface DeliveryProcessingResult {
  success: boolean;
  newStatus: PendingFormDeliveryStatus;
  messageId?: string;
  error?: string;
  shouldRetry?: boolean;
}

/**
 * Verifica se um erro é retryable
 */
function isRetryableError(error: string): boolean {
  const retryableCodes = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "rate limit",
    "Rate limit",
  ];
  return retryableCodes.some((code) => error.includes(code));
}

/**
 * Calcula delay com backoff exponencial
 */
function getRetryDelay(retryCount: number, baseDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, retryCount);
  const maxDelay = 5 * 60 * 1000; // 5 minutos máximo
  return Math.min(delay, maxDelay);
}

/**
 * Atualiza status da entrega
 */
async function updateDeliveryStatus(
  deliveryId: string,
  status: PendingFormDeliveryStatus,
  data?: {
    mediaId?: string;
    errorMessage?: string;
    completedAt?: Date;
  }
): Promise<void> {
  await prisma.pendingFormDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      ...(data?.mediaId && { mediaId: data.mediaId }),
      ...(data?.errorMessage && { 
        errorMessage: data.errorMessage,
        lastErrorAt: new Date(),
      }),
      ...(data?.completedAt && { completedAt: data.completedAt }),
      ...(status === "PROCESSING" && { retryCount: { increment: 1 } }),
    },
  });
}

/**
 * Envia mensagem de documento via Meta API
 */
async function sendDocument(
  instance: WhatsAppInstance,
  phone: string,
  mediaId: string,
  filename: string,
  caption?: string
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendDocumentMessage({
      instance,
      to: phone,
      mediaId,
      filename,
      caption,
    });

    if (!result.success || !result.messageId) {
      console.error("[DeliveryProcessor] Erro ao enviar documento:", result.error);
      return null;
    }

    return { messageId: result.messageId };
  } catch (error) {
    console.error("[DeliveryProcessor] Erro ao enviar documento:", error);
    return null;
  }
}

/**
 * Processa uma entrega pendente
 * Fluxo: Download PDF → Upload Meta → Send Document → Update Status
 */
export async function processPendingDelivery(
  delivery: PendingFormDelivery,
  instance: WhatsAppInstance
): Promise<DeliveryProcessingResult> {
  console.log(`[DeliveryProcessor] Processando entrega: ${delivery.id}`);

  // Verifica se já foi cancelada
  if (delivery.isCancelled) {
    return {
      success: false,
      newStatus: "CANCELLED",
      error: "Entrega foi cancelada",
    };
  }

  // Verifica expiração
  if (new Date() > delivery.expiresAt) {
    await updateDeliveryStatus(delivery.id, "EXPIRED");
    return {
      success: false,
      newStatus: "EXPIRED",
      error: "Entrega expirada",
    };
  }

  const maxRetries = parseInt(process.env.FORM_DELIVERY_MAX_RETRIES || "3", 10);

  // Verifica retry limit
  if (delivery.retryCount >= maxRetries) {
    await updateDeliveryStatus(delivery.id, "FAILED", {
      errorMessage: `Máximo de tentativas (${maxRetries}) atingido`,
    });
    return {
      success: false,
      newStatus: "FAILED",
      error: `Máximo de tentativas atingido`,
      shouldRetry: false,
    };
  }

  // Atualiza para PROCESSING
  await updateDeliveryStatus(delivery.id, "PROCESSING");

  try {
    // 1. Download do PDF
    console.log(`[DeliveryProcessor] Baixando PDF: ${delivery.pdfUrl}`);
    const downloadResult = await downloadPdf(delivery.pdfUrl, {
      timeout: parseInt(process.env.FORM_PDF_DOWNLOAD_TIMEOUT_MS || "30000", 10),
      maxSize: parseInt(process.env.FORM_MAX_PDF_SIZE_MB || "10", 10) * 1024 * 1024,
    });

    if (!downloadResult.success || !downloadResult.buffer) {
      const error = downloadResult.error || "Falha no download";
      const shouldRetry = isRetryableError(error);

      await updateDeliveryStatus(delivery.id, shouldRetry ? "WAITING" : "FAILED", {
        errorMessage: error,
      });

      return {
        success: false,
        newStatus: shouldRetry ? "WAITING" : "FAILED",
        error,
        shouldRetry,
      };
    }

    // 2. Upload para Meta
    console.log(`[DeliveryProcessor] Fazendo upload para Meta...`);
    const uploadResult = await uploadPdf(
      instance,
      downloadResult.buffer,
      delivery.pdfFilename
    );

    if (!uploadResult.success || !uploadResult.mediaId) {
      const error = uploadResult.error || "Falha no upload";
      const shouldRetry = isRetryableError(error);

      await updateDeliveryStatus(delivery.id, shouldRetry ? "WAITING" : "FAILED", {
        errorMessage: error,
      });

      return {
        success: false,
        newStatus: shouldRetry ? "WAITING" : "FAILED",
        error,
        shouldRetry,
      };
    }

    // 3. Envia documento
    console.log(`[DeliveryProcessor] Enviando documento...`);
    const sendResult = await sendDocument(
      instance,
      delivery.phone,
      uploadResult.mediaId,
      delivery.pdfFilename,
      `Olá ${delivery.leadName || ""}, aqui está seu Plano de Ação!`
    );

    if (!sendResult) {
      const error = "Falha ao enviar documento";
      await updateDeliveryStatus(delivery.id, "FAILED", { errorMessage: error });
      return {
        success: false,
        newStatus: "FAILED",
        error,
        shouldRetry: false,
      };
    }

    // 4. Sucesso! Atualiza para COMPLETED
    await updateDeliveryStatus(delivery.id, "COMPLETED", {
      mediaId: uploadResult.mediaId,
      completedAt: new Date(),
    });

    console.log(`[DeliveryProcessor] Entrega completada: ${delivery.id}`);

    return {
      success: true,
      newStatus: "COMPLETED",
      messageId: sendResult.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[DeliveryProcessor] Erro no processamento:`, error);

    const shouldRetry = isRetryableError(errorMessage);
    await updateDeliveryStatus(delivery.id, shouldRetry ? "WAITING" : "FAILED", {
      errorMessage,
    });

    return {
      success: false,
      newStatus: shouldRetry ? "WAITING" : "FAILED",
      error: errorMessage,
      shouldRetry,
    };
  }
}

/**
 * Processa evento de "delivered" da Meta
 * Busca a entrega pendente pelo messageId e inicia o processamento
 */
export async function handleDeliveredEvent(
  messageId: string
): Promise<DeliveryProcessingResult> {
  console.log(`[DeliveryProcessor] Evento delivered recebido: ${messageId}`);

  // Busca entrega pendente
  const delivery = await prisma.pendingFormDelivery.findUnique({
    where: { messageId },
    include: {
      instance: true,
    },
  });

  if (!delivery) {
    console.log(`[DeliveryProcessor] Entrega não encontrada para messageId: ${messageId}`);
    return {
      success: false,
      newStatus: "FAILED",
      error: "Entrega não encontrada",
    };
  }

  // Verifica se já foi processada (idempotência)
  if (delivery.status === "COMPLETED") {
    console.log(`[DeliveryProcessor] Entrega já completada: ${delivery.id}`);
    return {
      success: true,
      newStatus: "COMPLETED",
    };
  }

  // Verifica se está em estado válido para processar
  if (delivery.status !== "WAITING") {
    console.log(`[DeliveryProcessor] Entrega em estado inválido: ${delivery.status}`);
    return {
      success: false,
      newStatus: delivery.status,
      error: `Entrega em estado ${delivery.status}`,
    };
  }

  // Processa a entrega
  return processPendingDelivery(delivery, delivery.instance);
}

/**
 * Agenda retry automático para entregas que falharam com erro retryable
 */
export async function scheduleRetry(deliveryId: string): Promise<void> {
  const delivery = await prisma.pendingFormDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery || delivery.status !== "WAITING") {
    return;
  }

  const baseDelay = parseInt(process.env.FORM_DELIVERY_RETRY_BASE_MS || "1000", 10);
  const delay = getRetryDelay(delivery.retryCount, baseDelay);

  console.log(`[DeliveryProcessor] Agendando retry para ${deliveryId} em ${delay}ms`);

  // Agenda processamento após delay
  setTimeout(async () => {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: delivery.instanceId },
    });

    if (!instance) {
      console.error(`[DeliveryProcessor] Instância não encontrada para retry: ${delivery.instanceId}`);
      return;
    }

    await processPendingDelivery(delivery, instance);
  }, delay);
}
