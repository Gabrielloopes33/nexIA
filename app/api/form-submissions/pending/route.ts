/**
 * Lista de entregas pendentes
 * GET /api/form-submissions/pending
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/form-submissions/pending
 * Lista entregas em status WAITING ou PROCESSING
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Build where clause
    const where: Record<string, unknown> = {
      isCancelled: false,
      expiresAt: { gt: new Date() },
    };

    // Filtro de status (default: WAITING e PROCESSING)
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["WAITING", "PROCESSING"] };
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Busca dados
    const [deliveries, total] = await Promise.all([
      prisma.pendingFormDelivery.findMany({
        where,
        include: {
          organization: {
            select: { name: true },
          },
          instance: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pendingFormDelivery.count({ where }),
    ]);

    // Formata resposta
    const formattedDeliveries = deliveries.map((d) => ({
      id: d.id,
      messageId: d.messageId,
      phone: d.phone,
      leadName: d.leadName,
      leadEmail: d.leadEmail,
      organizationId: d.organizationId,
      organizationName: d.organization?.name || "Desconhecida",
      instanceId: d.instanceId,
      instanceName: d.instance?.name || "Desconhecida",
      templateName: d.templateName,
      status: d.status,
      retryCount: d.retryCount,
      pdfFilename: d.pdfFilename,
      dossieId: d.dossieId,
      createdAt: d.createdAt.toISOString(),
      expiresAt: d.expiresAt.toISOString(),
      isCancelled: d.isCancelled,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedDeliveries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[FormSubmissionsPending] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar entregas pendentes",
      },
      { status: 500 }
    );
  }
}
