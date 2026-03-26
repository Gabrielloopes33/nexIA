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
            probability: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Buscar informações dos usuários atribuídos separadamente
    const assignedToIds = deals
      .map(d => d.assignedTo)
      .filter((id): id is string => id !== null && id !== undefined);
    
    const users = assignedToIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assignedToIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Adicionar assignedUser aos deals
    const dealsWithUsers = deals.map(deal => ({
      ...deal,
      assignedUser: deal.assignedTo ? userMap.get(deal.assignedTo) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: dealsWithUsers,
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
