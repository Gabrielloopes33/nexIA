import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contacts/[id]/active-deal
 * Retorna o deal ativo do contato (se houver)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contactId } = await params;

    // Buscar deal ativo mais recente do contato
    const activeDeal = await prisma.deal.findFirst({
      where: {
        contactId,
        status: "OPEN",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        leadScore: true,
        expectedCloseDate: true,
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!activeDeal) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveDeal: false,
          deal: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActiveDeal: true,
        deal: activeDeal,
      },
    });
  } catch (error) {
    console.error("[Active Deal] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch active deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
