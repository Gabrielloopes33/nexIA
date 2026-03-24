import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contacts/[id]/deals
 * Retorna todos os deals (negócios) de um contato específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const deals = await prisma.deal.findMany({
      where: { 
        contactId: id,
        organizationId,
      },
      include: {
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: deals,
    });
  } catch (error) {
    console.error("[Contact Deals] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch contact deals",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
