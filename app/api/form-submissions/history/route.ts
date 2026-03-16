/**
 * Histórico de entregas
 * GET /api/form-submissions/history
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PendingFormDeliveryStatus } from "@prisma/client";

/**
 * GET /api/form-submissions/history
 * Lista histórico de entregas (COMPLETED, FAILED, EXPIRED, CANCELLED)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status") as PendingFormDeliveryStatus | null;
    const phone = searchParams.get("phone");
    const leadName = searchParams.get("leadName");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Build where clause
    const where: Record<string, unknown> = {
      status: { in: ["COMPLETED", "FAILED", "EXPIRED", "CANCELLED"] },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (status) {
      where.status = status;
    }

    if (phone) {
      where.phone = { contains: phone };
    }

    if (leadName) {
      where.leadName = { contains: leadName, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
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
      completedAt: d.completedAt?.toISOString() || null,
      errorMessage: d.errorMessage,
      isCancelled: d.isCancelled,
      cancelledAt: d.cancelledAt?.toISOString() || null,
      cancelledBy: d.cancelledBy,
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
    console.error("[FormSubmissionsHistory] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar histórico",
      },
      { status: 500 }
    );
  }
}
