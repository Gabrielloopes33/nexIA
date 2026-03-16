import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';

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

    console.log('[Pipeline Deals GET] Params:', { organizationId, stageId, status, contactId });

    // Build query
    let query = supabaseServer
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, phone, avatar_url),
        stage:pipeline_stages(id, name, color, probability),
        activities:deal_activities(count)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (stageId) query = query.eq('stage_id', stageId);
    if (status) query = query.eq('status', status);
    if (contactId) query = query.eq('contact_id', contactId);

    const { data: deals, error } = await query;

    if (error) {
      console.error('[Pipeline Deals GET] Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to fetch deals",
          details: error.message
        },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const dealsWithScore = (deals || []).map((deal) => ({
      ...deal,
      leadScore: calculateLeadScore(deal),
      activitiesCount: deal.activities?.[0]?.count || 0,
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

    console.log('[Pipeline Deals POST] Body:', body);

    if (!stageId || !contactId || !title) {
      return NextResponse.json(
        { success: false, error: "stageId, contactId, and title are required" },
        { status: 400 }
      );
    }

    // Create deal
    const { data: deal, error: dealError } = await supabaseServer
      .from('deals')
      .insert({
        organization_id: organizationId,
        stage_id: stageId,
        contact_id: contactId,
        title,
        description,
        amount: value ?? 0,
        currency,
        priority: priority,
        expected_close_date: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
        source,
        tags: tags ?? [],
        metadata: metadata ?? {},
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        contact:contacts(id, name, phone, avatar_url),
        stage:pipeline_stages(id, name, color, probability)
      `)
      .single();

    if (dealError) {
      console.error('[Pipeline Deals POST] Error creating deal:', dealError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create deal",
          details: dealError.message
        },
        { status: 500 }
      );
    }

    // Create initial activity
    const { error: activityError } = await supabaseServer
      .from('deal_activities')
      .insert({
        deal_id: deal.id,
        type: "NOTE",
        title: "Deal criado",
        content: "Deal criado manualmente no sistema",
        metadata: { source: "manual" },
        created_at: new Date().toISOString(),
      });

    if (activityError) {
      console.error('[Pipeline Deals POST] Error creating activity:', activityError);
      // Don't fail the request if activity creation fails
    }

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
  created_at: string;
  amount: number;
  priority: string;
  stage: { probability: number };
  activities?: { created_at: string }[];
}

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScore(deal: DealWithRelations): number {
  let score = 0;

  // 1. Age of deal (newer = hotter)
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
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
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity <= 3) score += 20;
    else if (daysSinceActivity <= 7) score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
