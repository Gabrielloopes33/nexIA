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
  dealId?: string;
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
  contactId: string,
  productId?: string
): Promise<Conversation> {
  // Busca conversa ativa recente (últimas 24h)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let conversation = await prisma.conversation.findFirst({
    where: {
      organizationId,
      contactId,
      status: "active",
      createdAt: {
        gte: yesterday,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (conversation) {
    return conversation;
  }

  // Cria nova conversa
  conversation = await prisma.conversation.create({
    data: {
      organizationId,
      contactId,
      productId,
      status: "active",
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
 * Resolve o produto e pipeline padrão da organização quando não informados
 */
async function resolveProductAndPipeline(
  organizationId: string,
  providedProductId?: string,
  providedPipelineId?: string
): Promise<{ productId: string; pipelineId: string } | null> {
  if (providedProductId && providedPipelineId) {
    return { productId: providedProductId, pipelineId: providedPipelineId };
  }

  // Se apenas um foi fornecido, valida e busca o outro
  if (providedProductId) {
    const product = await prisma.product.findFirst({
      where: { id: providedProductId, organizationId },
      include: { pipelines: { where: { status: "ACTIVE" }, orderBy: { isDefault: "desc" } } },
    });
    if (product && product.pipelines.length > 0) {
      return { productId: product.id, pipelineId: product.pipelines[0].id };
    }
  }

  if (providedPipelineId) {
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: providedPipelineId, organizationId },
      include: { product: true },
    });
    if (pipeline) {
      return { productId: pipeline.productId, pipelineId: pipeline.id };
    }
  }

  // Fallback: busca o primeiro produto ativo com pipeline
  const defaultProduct = await prisma.product.findFirst({
    where: { organizationId, status: "ACTIVE" },
    include: { pipelines: { where: { status: "ACTIVE" }, orderBy: { isDefault: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  if (defaultProduct && defaultProduct.pipelines.length > 0) {
    return { productId: defaultProduct.id, pipelineId: defaultProduct.pipelines[0].id };
  }

  return null;
}

/**
 * Cria um deal automaticamente a partir do webhook
 */
async function createDealFromWebhook(
  organizationId: string,
  contactId: string,
  productId: string,
  pipelineId: string,
  leadName: string
): Promise<string | null> {
  try {
    // Busca o stage inicial do pipeline
    const initialStage = await prisma.pipelineStage.findFirst({
      where: { pipelineId },
      orderBy: { position: "asc" },
    });

    if (!initialStage) {
      console.warn("[FormWebhook] Nenhum stage encontrado para o pipeline", pipelineId);
      return null;
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId,
        productId,
        pipelineId,
        contactId,
        stageId: initialStage.id,
        title: `Lead ${leadName}`,
        status: "OPEN",
        value: 0,
        currency: "BRL",
        priority: "MEDIUM",
        createdBy: "system",
        source: "typebot",
      },
    });

    await prisma.dealActivity.create({
      data: {
        dealId: deal.id,
        user_id: "system",
        type: "DEAL_CREATED",
        description: "Negócio criado automaticamente via formulário Typebot",
        metadata: { source: "typebot" },
      },
    });

    console.log(`[FormWebhook] Deal criado: ${deal.id}`);
    return deal.id;
  } catch (error) {
    console.error("[FormWebhook] Erro ao criar deal:", error);
    return null;
  }
}

/**
 * Processa o webhook de formulário recebido
 * Fluxo: Cria contato → Cria conversa → (opcional) Cria deal → Envia template → Cria pendente
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

    // 3. Resolve produto e pipeline
    const resolved = await resolveProductAndPipeline(
      payload.organizationId,
      payload.productId,
      payload.pipelineId
    );

    // 4. Busca ou cria conversa
    const conversation = await getOrCreateConversation(
      payload.organizationId,
      contact.id,
      resolved?.productId
    );

    // 5. Cria deal automaticamente se produto/pipeline resolvidos
    let dealId: string | null = null;
    if (resolved) {
      dealId = await createDealFromWebhook(
        payload.organizationId,
        contact.id,
        resolved.productId,
        resolved.pipelineId,
        payload.leadData.nome
      );
    }

    // 6. Envia template message
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

    // 7. Registra mensagem no banco
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        messageId: templateResult.messageId,
        direction: "OUTBOUND",
        content: `[Template: ${payload.templateName}]`,
        status: "SENT",
      },
    });

    console.log(`[FormWebhook] Webhook processado com sucesso`);

    return {
      success: true,
      contactId: contact.id,
      conversationId: conversation.id,
      dealId: dealId || undefined,
      templateMessageId: templateResult.messageId,
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
