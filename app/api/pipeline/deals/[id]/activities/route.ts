import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ActivityType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pipeline/deals/[id]/activities
 * Retorna atividades do deal
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const activities = await prisma.dealActivity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("[Pipeline Activities] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch activities",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipeline/deals/[id]/activities
 * Cria nova atividade (nota, call, etc)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, description, metadata, createdBy } = body;

    if (!type || !description) {
      return NextResponse.json(
        { success: false, error: "Type and description are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.dealActivity.create({
      data: {
        dealId: id,
        type: type as ActivityType,
        description,
        metadata: metadata ?? {},
        createdBy,
      },
    });

    // Update deal's updatedAt
    await prisma.deal.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("[Pipeline Activities] Error creating activity:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create activity",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
