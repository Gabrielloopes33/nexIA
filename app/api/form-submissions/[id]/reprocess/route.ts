/**
 * Reprocessar entrega manualmente
 * POST /api/form-submissions/[id]/reprocess
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processPendingDelivery } from "@/lib/whatsapp/form-delivery-processor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/form-submissions/[id]/reprocess
 * Reprocessa uma entrega manualmente
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    // Busca a entrega original
    const originalDelivery = await prisma.pendingFormDelivery.findUnique({
      where: { id },
      include: { instance: true },
    });

    if (!originalDelivery) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega não encontrada",
        },
        { status: 404 }
      );
    }

    // Verifica se pode ser reprocessada
    if (originalDelivery.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega já foi completada",
        },
        { status: 400 }
      );
    }

    if (originalDelivery.isCancelled) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega foi cancelada",
        },
        { status: 400 }
      );
    }

    // Cria nova entrega baseada na original
    const expiryHours = parseInt(
      process.env.FORM_DELIVERY_EXPIRY_HOURS || "24",
      10
    );
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const newDelivery = await prisma.pendingFormDelivery.create({
      data: {
        messageId: `${originalDelivery.messageId}_reprocess_${Date.now()}`,
        organizationId: originalDelivery.organizationId,
        instanceId: originalDelivery.instanceId,
        phone: originalDelivery.phone,
        pdfUrl: originalDelivery.pdfUrl,
        pdfFilename: originalDelivery.pdfFilename,
        templateName: originalDelivery.templateName,
        templateLanguage: originalDelivery.templateLanguage,
        leadName: originalDelivery.leadName,
        leadEmail: originalDelivery.leadEmail,
        dossieId: originalDelivery.dossieId,
        alunoId: originalDelivery.alunoId,
        status: "PROCESSING",
        retryCount: 0,
        isCancelled: false,
        expiresAt,
        reprocessedFrom: originalDelivery.id,
      },
    });

    // Processa imediatamente
    const result = await processPendingDelivery(
      newDelivery,
      originalDelivery.instance
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Entrega reprocessada com sucesso",
        data: {
          newDeliveryId: newDelivery.id,
          status: result.newStatus,
          messageId: result.messageId,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Falha no reprocessamento",
        error: result.error,
        data: {
          newDeliveryId: newDelivery.id,
          status: result.newStatus,
        },
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[FormSubmissionsReprocess] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao reprocessar entrega",
      },
      { status: 500 }
    );
  }
}
