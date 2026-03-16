/**
 * Cancelar entrega
 * POST /api/form-submissions/[id]/cancel
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/form-submissions/[id]/cancel
 * Cancela uma entrega pendente
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId, reason } = body;

    // Busca a entrega
    const delivery = await prisma.pendingFormDelivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega não encontrada",
        },
        { status: 404 }
      );
    }

    // Verifica se pode ser cancelada
    if (delivery.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega já foi completada e não pode ser cancelada",
        },
        { status: 400 }
      );
    }

    if (delivery.isCancelled) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrega já está cancelada",
        },
        { status: 400 }
      );
    }

    // Cancela a entrega
    await prisma.pendingFormDelivery.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledBy: userId || "system",
        status: "CANCELLED",
        errorMessage: reason || "Cancelado manualmente",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Entrega cancelada com sucesso",
    });
  } catch (error) {
    console.error("[FormSubmissionsCancel] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao cancelar entrega",
      },
      { status: 500 }
    );
  }
}
