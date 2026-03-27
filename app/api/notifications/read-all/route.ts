import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Marcar como dinâmico para evitar pré-renderização estática
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/read-all
 * Marca todas as notificações como lidas
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      organizationId,
      read: false,
    };

    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        count: result.count,
      },
    });
  } catch (error) {
    console.error("[Notifications] Error marking all as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark notifications as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
