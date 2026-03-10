import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DealPriority, DealStatus } from "@prisma/client";

/**
 * GET /api/pipeline/deals
 * Retorna deals com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default_org_id";
    const stageId = searchParams.get("stageId");
    const status = searchParams.get("status") as DealStatus | null;
    const contactId = searchParams.get("contactId");

    const where: Record<string, unknown> = { organizationId };
    if (stageId) where.stageId = stageId;
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    const deals = await prisma.deal.findMany({
      where,
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
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate lead score for each deal
    const dealsWithScore = deals.map((deal) => ({
      ...deal,
      leadScore: calculateLeadScore(deal),
      activitiesCount: deal._count.activities,
    }));

    return NextResponse.json({
      success: true,
      data: dealsWithScore,
    });
  } catch (error) {
    console.error("[Pipeline Deals] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch deals",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipeline/deals
 * Cria novo deal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId = "default_org_id",
      stageId,
      contactId,
      title,
      description,
      value,
      currency = "BRL",
      priority = "MEDIUM",
      expectedCloseDate,
      source,
      tags,
      metadata,
    } = body;

    if (!stageId || !contactId || !title) {
      return NextResponse.json(
        { success: false, error: "stageId, contactId, and title are required" },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId,
        stageId,
        contactId,
        title,
        description,
        amount: value ?? 0,
        currency,
        priority: priority as DealPriority,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        source,
        tags: tags ?? [],
        metadata: metadata ?? {},
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

    // Create initial activity
    await prisma.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "NOTE",
        title: "Deal criado",
        content: "Deal criado manualmente no sistema",
        metadata: { source: "manual" },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...deal,
        leadScore: calculateLeadScore(deal),
      },
    });
  } catch (error) {
    console.error("[Pipeline Deals] Error creating deal:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

interface DealWithRelations {
  id: string;
  createdAt: Date;
  amount: number;
  priority: DealPriority;
  stage: { probability: number };
  activities: { createdAt: Date }[];
}

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScore(deal: DealWithRelations): number {
  let score = 0;

  // 1. Age of deal (newer = hotter)
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated <= 7) score += 20;
  else if (daysSinceCreated <= 30) score += 10;
  else score += 5;

  // 2. Deal value
  const amount = Number(deal.amount);
  if (amount > 50000) score += 20;
  else if (amount > 10000) score += 15;
  else if (amount > 5000) score += 10;
  else score += 5;

  // 3. Priority
  switch (deal.priority) {
    case "HIGH":
      score += 15;
      break;
    case "MEDIUM":
      score += 10;
      break;
    case "LOW":
      score += 5;
      break;
  }

  // 4. Stage probability
  score += deal.stage.probability * 0.15;

  // 5. Recent activity (if available)
  if (deal.activities && deal.activities.length > 0) {
    const lastActivity = deal.activities[0];
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity <= 3) score += 20;
    else if (daysSinceActivity <= 7) score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
