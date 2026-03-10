import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DealPriority, DealStatus, ActivityType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pipeline/deals/[id]
 * Retorna detalhes de um deal
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            probability: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("[Pipeline Deal] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pipeline/deals/[id]
 * Atualiza deal (usado para mover estágio)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stageId, status, title, description, value, priority, expectedCloseDate, metadata } = body;

    // Get current deal to check stage change
    const currentDeal = await prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!currentDeal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    // Update deal
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(stageId && { stageId }),
        ...(status && { status: status as DealStatus }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { amount: value }),
        ...(priority && { priority: priority as DealPriority }),
        ...(expectedCloseDate && { expectedCloseDate: new Date(expectedCloseDate) }),
        ...(metadata && { metadata }),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            probability: true,
          },
        },
      },
    });

    // Create activity if stage changed
    if (stageId && stageId !== currentDeal.stageId) {
      const newStage = await prisma.pipelineStage.findUnique({
        where: { id: stageId },
      });

      await prisma.dealActivity.create({
        data: {
          dealId: id,
          type: ActivityType.STAGE_CHANGE,
          title: "Mudança de estágio",
          content: `Movido de '${currentDeal.stage.name}' para '${newStage?.name}'`,
          metadata: {
            fromStageId: currentDeal.stageId,
            toStageId: stageId,
            fromStageName: currentDeal.stage.name,
            toStageName: newStage?.name,
          },
        },
      });
    }

    // Create activity if status changed to WON or LOST
    if (status && status !== currentDeal.status) {
      if (status === "WON") {
        await prisma.dealActivity.create({
          data: {
            dealId: id,
            type: ActivityType.SYSTEM,
            title: "Deal ganho",
            content: "Deal marcado como GANHO",
            metadata: { status: "WON" },
          },
        });
        await prisma.deal.update({
          where: { id },
          data: { actualCloseDate: new Date() },
        });
      } else if (status === "LOST") {
        await prisma.dealActivity.create({
          data: {
            dealId: id,
            type: ActivityType.SYSTEM,
            title: "Deal perdido",
            content: "Deal marcado como PERDIDO",
            metadata: { status: "LOST" },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("[Pipeline Deal] Error updating deal:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pipeline/deals/[id]
 * Remove um deal
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("[Pipeline Deal] Error deleting deal:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
