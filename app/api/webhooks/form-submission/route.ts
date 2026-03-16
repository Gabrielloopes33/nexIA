/**
 * Webhook para receber formulários do Plano de Ação
 * POST /api/webhooks/form-submission
 */

import { NextRequest, NextResponse } from "next/server";
import { validateWebhook } from "@/lib/whatsapp/form-webhook-validator";
import { processFormWebhook } from "@/lib/whatsapp/form-webhook-processor";

/**
 * Rate limiting simples (em memória)
 * Em produção, usar Redis ou similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const limit = parseInt(process.env.FORM_WEBHOOK_RATE_LIMIT_PER_MIN || "10", 10);
  const windowMs = 60 * 1000; // 1 minuto

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/webhooks/form-submission
 * Recebe webhook do sistema plano-de-acao-lancamento
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.ip || "unknown";

  console.log(`[FormWebhook] Recebendo webhook de ${ip}`);

  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      console.warn(`[FormWebhook] Rate limit exceeded for ${ip}`);
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          errorCode: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Parse do body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body",
          errorCode: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    // Validação
    const validation = validateWebhook(body);

    if (!validation.isValid) {
      console.warn(`[FormWebhook] Validação falhou: ${validation.errorMessage}`);
      
      const statusCode =
        validation.errorCode === "INVALID_SECRET" ? 401 :
        validation.errorCode === "INVALID_PAYLOAD" ? 400 : 500;

      return NextResponse.json(
        {
          success: false,
          error: validation.errorMessage,
          errorCode: validation.errorCode,
        },
        { status: statusCode }
      );
    }

    // Processa o webhook
    const result = await processFormWebhook(validation.payload!);

    if (!result.success) {
      console.error(`[FormWebhook] Processamento falhou: ${result.error}`);
      
      const statusCode =
        result.errorCode === "INSTANCE_NOT_FOUND" ? 404 :
        result.errorCode === "TEMPLATE_NOT_FOUND" ? 404 :
        result.errorCode === "TEMPLATE_NOT_APPROVED" ? 400 : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[FormWebhook] Processado em ${duration}ms: ${result.pendingDeliveryId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          contactId: result.contactId,
          conversationId: result.conversationId,
          templateMessageId: result.templateMessageId,
          pendingDeliveryId: result.pendingDeliveryId,
          status: "WAITING",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FormWebhook] Erro não tratado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/form-submission
 * Endpoint de health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "form-submission-webhook",
    timestamp: new Date().toISOString(),
  });
}
