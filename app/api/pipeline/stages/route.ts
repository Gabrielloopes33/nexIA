import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// ============================================
// TIPOS
// ============================================

interface StageInput {
  name: string;
  color?: string;
  probability?: number;
  isClosed?: boolean;
}

interface CreateStagesBody {
  organizationId: string;
  stages: StageInput[];
}

interface DeleteStagesBody {
  organizationId: string;
}

// ============================================
// CONSTANTES DE VALIDAÇÃO
// ============================================

const MIN_STAGES = 5;
const MAX_STAGES = 10;
const DEFAULT_STAGE_COLOR = "#3b82f6";

// ============================================
// GET /api/pipeline/stages
// Retorna estágios do pipeline da organização
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || "default_org_id";

    console.log('[Pipeline Stages GET] organizationId:', organizationId);

    // Busca uma organização válida
    let orgId = organizationId;
    
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      orgId = existingOrg?.id || organizationId;
    }

    const { data: stages, error } = await supabaseServer
      .from('pipeline_stages')
      .select('*')
      .eq('organization_id', orgId)
      .order('position', { ascending: true });

    if (error) {
      console.error('[Pipeline Stages GET] Error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to fetch pipeline stages",
          details: error.message
        },
        { status: 500 }
      );
    }

    // Conta deals por estágio
    const { data: dealsCount } = await supabaseServer
      .from('deals')
      .select('stage_id', { count: 'exact' })
      .eq('organization_id', orgId);

    const dealsByStage: Record<string, number> = {};
    dealsCount?.forEach((d: any) => {
      dealsByStage[d.stage_id] = (dealsByStage[d.stage_id] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: (stages || []).map((stage) => ({
        ...stage,
        dealsCount: dealsByStage[stage.id] || 0,
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

// ============================================
// POST /api/pipeline/stages
// Cria múltiplas etapas do pipeline de uma vez
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateStagesBody = await request.json();
    const { organizationId, stages } = body;

    console.log('[Pipeline Stages POST] Body:', body);

    // Validação: organizationId é obrigatório
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Validação: stages deve ser um array
    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { success: false, error: "stages must be an array" },
        { status: 400 }
      );
    }

    // Validação: mínimo de etapas
    if (stages.length < MIN_STAGES) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum ${MIN_STAGES} stages required`,
          details: `Received ${stages.length} stages, but at least ${MIN_STAGES} are required`
        },
        { status: 400 }
      );
    }

    // Validação: máximo de etapas
    if (stages.length > MAX_STAGES) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Maximum ${MAX_STAGES} stages allowed`,
          details: `Received ${stages.length} stages, but maximum allowed is ${MAX_STAGES}`
        },
        { status: 400 }
      );
    }

    // Validação: cada etapa deve ter um nome
    const invalidStages: Array<{ index: number; name: unknown }> = [];
    stages.forEach((stage, index) => {
      if (!stage.name || typeof stage.name !== "string" || stage.name.trim() === "") {
        invalidStages.push({ index, name: stage.name });
      }
    });

    if (invalidStages.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All stages must have a valid name",
          details: `Invalid stages at indexes: ${invalidStages.map(s => (s as {index: number}).index).join(", ")}`
        },
        { status: 400 }
      );
    }

    // Busca uma organização válida
    let orgId = organizationId;
    
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      orgId = existingOrg?.id || organizationId;
    }

    // Verifica se já existe um pipeline para esta organização
    const { count: existingStagesCount, error: countError } = await supabaseServer
      .from('pipeline_stages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (countError) {
      console.error('[Pipeline Stages POST] Error counting:', countError);
    }

    const isFirstPipeline = (existingStagesCount || 0) === 0;

    // Busca a última posição existente (se houver)
    const { data: lastStage, error: lastError } = await supabaseServer
      .from('pipeline_stages')
      .select('position')
      .eq('organization_id', orgId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const startPosition = lastStage ? lastStage.position + 1 : 0;

    // Prepara os dados para criação em batch
    const stagesData = stages.map((stage, index) => ({
      organization_id: orgId,
      name: stage.name.trim(),
      color: stage.color || DEFAULT_STAGE_COLOR,
      position: startPosition + index,
      probability: stage.probability ?? 0,
      is_closed: stage.isClosed ?? false,
      is_default: isFirstPipeline && index === 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Cria todas as etapas
    const { data: createdStages, error: insertError } = await supabaseServer
      .from('pipeline_stages')
      .insert(stagesData)
      .select();

    if (insertError) {
      console.error('[Pipeline Stages POST] Error creating:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create pipeline stages",
          details: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: createdStages,
      meta: {
        totalCreated: createdStages?.length || 0,
        isFirstPipeline,
        defaultStageId: isFirstPipeline ? createdStages?.[0]?.id : null,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[Pipeline Stages] Error creating stages:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create pipeline stages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/pipeline/stages
// Remove todas as etapas de uma organização (reset)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteStagesBody = await request.json();
    const { organizationId } = body;

    // Validação: organizationId é obrigatório
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Busca uma organização válida
    let orgId = organizationId;
    
    if (organizationId === 'default_org_id') {
      const { data: existingOrg } = await supabaseServer
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      orgId = existingOrg?.id || organizationId;
    }

    // Conta quantas etapas serão removidas
    const { count: stagesCount, error: countError } = await supabaseServer
      .from('pipeline_stages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (countError) {
      console.error('[Pipeline Stages DELETE] Error counting:', countError);
    }

    if ((stagesCount || 0) === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No stages found for this organization",
          details: "The organization does not have any pipeline stages to delete"
        },
        { status: 404 }
      );
    }

    // Verifica se existem deals associados às etapas
    const { data: dealsData, error: dealsError } = await supabaseServer
      .from('deals')
      .select('stage_id')
      .eq('organization_id', orgId);
    
    const stagesWithDealsIds = new Set(dealsData?.map(d => d.stage_id) || []);

    if (dealsError) {
      console.error('[Pipeline Stages DELETE] Error checking deals:', dealsError);
    }

    // Busca nomes dos estágios com deals
    const { data: stagesData } = await supabaseServer
      .from('pipeline_stages')
      .select('id, name')
      .eq('organization_id', orgId)
      .in('id', Array.from(stagesWithDealsIds));
    
    const stagesWithDealsList = stagesData || [];

    // Deleta todas as etapas da organização
    const { count: deletedCount, error: deleteError } = await supabaseServer
      .from('pipeline_stages')
      .delete()
      .eq('organization_id', orgId);

    if (deleteError) {
      console.error('[Pipeline Stages DELETE] Error:', deleteError);
      
      // Tratamento específico para erro de constraint de FK
      if (deleteError.message.includes("foreign key constraint")) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Cannot delete stages with associated deals",
            details: "Please move or delete all deals from these stages before resetting the pipeline"
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to delete pipeline stages",
          details: deleteError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedCount || 0,
        organizationId,
      },
      meta: {
        warning: stagesWithDealsList.length > 0 
          ? `Some stages had associated deals: ${stagesWithDealsList.map(s => s.name).join(", ")}`
          : null,
      }
    });

  } catch (error) {
    console.error("[Pipeline Stages] Error deleting stages:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete pipeline stages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
