/**
 * Estatísticas de entregas de formulários
 * GET /api/form-submissions/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PendingFormDeliveryStatus } from "@prisma/client";

/**
 * GET /api/form-submissions/stats
 * Retorna estatísticas gerais de entregas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    // Base where clause
    const baseWhere = organizationId
      ? { organizationId }
      : {};

    // Data de hoje (00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Últimas 24h
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Contagens
    const [
      totalToday,
      pendingCount,
      completedCount,
      failedLast24h,
      totalCompleted,
    ] = await Promise.all([
      // Total de envios hoje
      prisma.pendingFormDelivery.count({
        where: {
          ...baseWhere,
          createdAt: { gte: today },
        },
      }),

      // Pendentes (aguardando delivered ou processando)
      prisma.pendingFormDelivery.count({
        where: {
          ...baseWhere,
          status: { in: ["WAITING", "PROCESSING"] },
          isCancelled: false,
          expiresAt: { gt: new Date() },
        },
      }),

      // Completados nas últimas 24h
      prisma.pendingFormDelivery.count({
        where: {
          ...baseWhere,
          status: "COMPLETED",
          completedAt: { gte: last24h },
        },
      }),

      // Falhas nas últimas 24h
      prisma.pendingFormDelivery.count({
        where: {
          ...baseWhere,
          status: "FAILED",
          lastErrorAt: { gte: last24h },
        },
      }),

      // Total completados (para calcular taxa de sucesso)
      prisma.pendingFormDelivery.count({
        where: {
          ...baseWhere,
          status: "COMPLETED",
        },
      }),
    ]);

    // Total processados (completed + failed + expired)
    const totalProcessed = await prisma.pendingFormDelivery.count({
      where: {
        ...baseWhere,
        status: { in: ["COMPLETED", "FAILED", "EXPIRED"] },
      },
    });

    // Taxa de sucesso
    const successRate =
      totalProcessed > 0
        ? Math.round((totalCompleted / totalProcessed) * 100)
        : 0;

    // Timeline dos últimos 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const timelineData = await prisma.pendingFormDelivery.groupBy({
      by: ["status", "createdAt"],
      where: {
        ...baseWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    });

    // Agrupa por dia
    const timeline: Record<
      string,
      Record<PendingFormDeliveryStatus, number>
    > = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      timeline[dateKey] = {
        WAITING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0,
        EXPIRED: 0,
        CANCELLED: 0,
      };
    }

    for (const item of timelineData) {
      const dateKey = item.createdAt.toISOString().split("T")[0];
      if (timeline[dateKey]) {
        timeline[dateKey][item.status] = item._count.id;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalToday,
        successRate,
        pendingCount,
        failedLast24h,
        timeline: Object.entries(timeline).map(([date, counts]) => ({
          date,
          ...counts,
        })),
      },
    });
  } catch (error) {
    console.error("[FormSubmissionsStats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar estatísticas",
      },
      { status: 500 }
    );
  }
}
