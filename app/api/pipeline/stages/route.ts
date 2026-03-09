import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/pipeline/stages
 * Retorna estágios do pipeline da organização
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default_org_id";

    const stages = await prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: stages.map((stage) => ({
        ...stage,
        dealsCount: stage._count.deals,
      })),
    });
  } catch (error) {
    console.error("[Pipeline Stages] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch pipeline stages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipeline/stages
 * Cria novo estágio no pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId = "default_org_id", name, color, order, probability } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        organizationId,
        name,
        color: color || "#3b82f6",
        order: order ?? 0,
        probability: probability ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: stage,
    });
  } catch (error) {
    console.error("[Pipeline Stages] Error creating stage:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create pipeline stage",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
