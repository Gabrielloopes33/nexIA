import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRLS } from "@/lib/db/rls";
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";

type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';

/**
 * GET /api/pipeline/deals
 * Retorna deals com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("stageId");
    const status = searchParams.get("status") as DealStatus | null;
    const contactId = searchParams.get("contactId");

    console.log('[Pipeline Deals GET] Params:', { organizationId, stageId, status, contactId });

    const where: any = { organizationId };
    if (stageId) where.stageId = stageId;
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    // Executa com contexto RLS para isolamento multi-tenant
    const deals = await withRLS(prisma, organizationId, async (tx) => {
      return tx.deal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          stage: { select: { id: true, name: true, color: true, probability: true } },
        },
      });
    });

    // Transform data to match expected format
    const dealsWithScore = deals.map((deal) => ({
      ...deal,
      leadScore: calculateLeadScore({
        ...deal,
        created_at: deal.createdAt.toISOString(),
        stage: deal.stage,
      }),
      activitiesCount: 0,
    }));

    return NextResponse.json({
      success: true,
      data: dealsWithScore,
    });
  } catch (error) {
    console.error("[Pipeline Deals GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

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
    const organizationId = await getOrganizationId();
    
    const body = await request.json();
    const {
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

    console.log('[Pipeline Deals POST] Body:', body);

    if (!stageId || !contactId || !title) {
      return NextResponse.json(
        { success: false, error: "stageId, contactId, and title are required" },
        { status: 400 }
      );
    }

    // Create deal - com contexto RLS
    const deal = await withRLS(prisma, organizationId, async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          organizationId,
          stageId,
          contactId,
          title,
          description,
          amount: value ?? 0,
          currency,
          priority,
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
          source,
          tags: tags ?? [],
          metadata: metadata ?? {},
          status: 'OPEN',
        },
        include: {
          contact: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          stage: { select: { id: true, name: true, color: true, probability: true } },
        },
      });

      // Create initial activity
      try {
        await tx.dealActivity.create({
          data: {
            dealId: newDeal.id,
            type: "NOTE",
            title: "Deal criado",
            content: "Deal criado manualmente no sistema",
            metadata: { source: "manual" },
          },
        });
      } catch (activityError) {
        console.error('[Pipeline Deals POST] Error creating activity:', activityError);
        // Don't fail the request if activity creation fails
      }

      return newDeal;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...deal,
        leadScore: calculateLeadScore({
          ...deal,
          created_at: deal.createdAt.toISOString(),
          stage: deal.stage,
        }),
      },
    });
  } catch (error) {
    console.error("[Pipeline Deals POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

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
  created_at?: string;
  amount: number;
  priority: string;
  stage: { probability: number };
  activities?: { createdAt: Date }[];
}

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScore(deal: DealWithRelations): number {
  let score = 0;

  const createdAt = deal.created_at 
    ? new Date(deal.created_at) 
    : deal.createdAt;

  // 1. Age of deal (newer = hotter)
  const daysSinceCreated = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
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
  score += deal.stage?.probability * 0.15 || 0;

  // 5. Recent activity (if available)
  if (deal.activities && deal.activities.length > 0) {
    const lastActivity = deal.activities[0];
    const activityDate = 'createdAt' in lastActivity 
      ? lastActivity.createdAt 
      : new Date((lastActivity as any).created_at);
    const daysSinceActivity = Math.floor(
      (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity <= 3) score += 20;
    else if (daysSinceActivity <= 7) score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
