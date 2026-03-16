/**
 * Processador de webhooks de formulários
 * Recebe webhook do plano-de-acao e inicia o fluxo de entrega
 */

import { prisma } from "@/lib/db";
import { WhatsAppInstance, Contact, Conversation } from "@prisma/client";
import { ValidatedFormSubmissionPayload } from "./form-webhook-validator";
import { sendTemplateMessage } from "./cloud-api";

export interface WebhookProcessingResult {
  success: boolean;
  contactId?: string;
  conversationId?: string;
  templateMessageId?: string;
  pendingDeliveryId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Busca ou cria um contato
 */
async function getOrCreateContact(
  organizationId: string,
  leadData: ValidatedFormSubmissionPayload["leadData"]
): Promise<Contact> {
  const phone = leadData.telefone;

  // Tenta encontrar contato existente
  let contact = await prisma.contact.findUnique({
    where: {
      organizationId_phone: {
        organizationId,
        phone,
      },
    },
  });

  if (contact) {
    // Atualiza dados se necessário
    if (leadData.nome && contact.name !== leadData.nome) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: leadData.nome,
          lastInteractionAt: new Date(),
        },
      });
    }
    return contact;
  }

  // Cria novo contato
  contact = await prisma.contact.create({
    data: {
      organizationId,
      phone,
      name: leadData.nome,
      status: "ACTIVE",
      lastInteractionAt: new Date(),
      metadata: {
        source: "typebot",
        email: leadData.email,
      },
    },
  });

  console.log(`[FormWebhook] Novo contato criado: ${contact.id}`);
  return contact;
}

/**
 * Cria ou atualiza uma conversa
 */
async function getOrCreateConversation(
  organizationId: string,
  instanceId: string,
  contactId: string
): Promise<Conversation> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  // Busca conversa ativa
  let conversation = await prisma.conversation.findFirst({
    where: {
      organizationId,
      instanceId,
      contactId,
      status: "ACTIVE",
      windowEnd: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (conversation) {
    // Atualiza janela
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        windowEnd,
        lastMessageAt: now,
      },
    });
    return conversation;
  }

  // Cria nova conversa
  conversation = await prisma.conversation.create({
    data: {
      organizationId,
      instanceId,
      contactId,
      type: "BUSINESS_INITIATED",
      status: "ACTIVE",
      windowStart: now,
      windowEnd,
      lastMessageAt: now,
      messageCount: 0,
    },
  });

  console.log(`[FormWebhook] Nova conversa criada: ${conversation.id}`);
  return conversation;
}

/**
 * Envia template message via Meta API
 */
async function sendTemplate(
  instance: WhatsAppInstance,
  phone: string,
  templateName: string,
  templateLanguage: string,
  templateVariables: string[]
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendTemplateMessage({
      instance,
      to: phone,
      templateName,
      language: templateLanguage,
      components: [
        {
          type: "body",
          parameters: templateVariables.map((varValue) => ({
            type: "text",
            text: varValue,
          })),
        },
      ],
    });

    if (!result.success || !result.messageId) {
      console.error("[FormWebhook] Erro ao enviar template:", result.error);
      return null;
    }

    return { messageId: result.messageId };
  } catch (error) {
    console.error("[FormWebhook] Erro ao enviar template:", error);
    return null;
  }
}

/**
 * Cria registro de entrega pendente
 */
async function createPendingDelivery(
  messageId: string,
  payload: ValidatedFormSubmissionPayload,
  contactId: string
): Promise<string> {
  const expiryHours = parseInt(
    process.env.FORM_DELIVERY_EXPIRY_HOURS || "24",
    10
  );
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  const delivery = await prisma.pendingFormDelivery.create({
    data: {
      messageId,
      organizationId: payload.organizationId,
      instanceId: payload.instanceId,
      phone: payload.leadData.telefone,
      pdfUrl: payload.pdfUrl,
      pdfFilename: payload.pdfFilename,
      templateName: payload.templateName,
      templateLanguage: payload.templateLanguage,
      leadName: payload.leadData.nome,
      leadEmail: payload.leadData.email,
      dossieId: payload.dossieId,
      alunoId: payload.alunoId,
      status: "WAITING",
      retryCount: 0,
      isCancelled: false,
      expiresAt,
    },
  });

  console.log(`[FormWebhook] Entrega pendente criada: ${delivery.id}`);
  return delivery.id;
}

/**
 * Processa o webhook de formulário recebido
 * Fluxo: Cria contato → Cria conversa → Envia template → Cria pendente
 */
export async function processFormWebhook(
  payload: ValidatedFormSubmissionPayload
): Promise<WebhookProcessingResult> {
  console.log(`[FormWebhook] Processando webhook para ${payload.leadData.telefone}`);

  try {
    // 1. Busca instância
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: payload.instanceId },
    });

    if (!instance) {
      return {
        success: false,
        error: `Instância não encontrada: ${payload.instanceId}`,
        errorCode: "INSTANCE_NOT_FOUND",
      };
    }

    if (instance.organizationId !== payload.organizationId) {
      return {
        success: false,
        error: "Instância não pertence à organização",
        errorCode: "INVALID_ORGANIZATION",
      };
    }

    // 2. Busca ou cria contato
    const contact = await getOrCreateContact(
      payload.organizationId,
      payload.leadData
    );

    // 3. Busca ou cria conversa
    const conversation = await getOrCreateConversation(
      payload.organizationId,
      payload.instanceId,
      contact.id
    );

    // 4. Envia template message
    const templateResult = await sendTemplate(
      instance,
      payload.leadData.telefone,
      payload.templateName,
      payload.templateLanguage,
      payload.templateVariables
    );

    if (!templateResult) {
      return {
        success: false,
        error: "Falha ao enviar template message",
        errorCode: "TEMPLATE_SEND_FAILED",
      };
    }

    // 5. Cria registro de entrega pendente
    const pendingDeliveryId = await createPendingDelivery(
      templateResult.messageId,
      payload,
      contact.id
    );

    // 6. Registra mensagem no banco
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        messageId: templateResult.messageId,
        direction: "OUTBOUND",
        type: "TEMPLATE",
        content: `[Template: ${payload.templateName}]`,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    console.log(`[FormWebhook] Webhook processado com sucesso: ${pendingDeliveryId}`);

    return {
      success: true,
      contactId: contact.id,
      conversationId: conversation.id,
      templateMessageId: templateResult.messageId,
      pendingDeliveryId,
    };
  } catch (error) {
    console.error("[FormWebhook] Erro no processamento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
      errorCode: "INTERNAL_ERROR",
    };
  }
}
