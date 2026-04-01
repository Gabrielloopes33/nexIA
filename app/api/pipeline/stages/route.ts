import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getOrganizationId, 
  requireOrganizationMembership,
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";

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
  stages: StageInput[];
  pipelineId?: string;
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
    const organizationId = await getOrganizationId();

    console.log('[Pipeline Stages GET] organizationId:', organizationId);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const pipelineIdQuery = searchParams.get("pipelineId");

    let pipelineId: string | null = pipelineIdQuery;

    // Se productId foi informado sem pipelineId, busca o pipeline padrão do produto
    if (!pipelineId && productId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { productId, organizationId, isDefault: true },
      });
      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
      }
    }

    // Valida pipeline se informado
    if (pipelineId) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: pipelineId, organizationId },
      });
      if (!pipeline) {
        return NextResponse.json(
          { success: false, error: "Pipeline not found" },
          { status: 404 }
        );
      }
    }

    const stages = await prisma.pipelineStage.findMany({
      where: pipelineId ? { pipelineId } : { organizationId },
      orderBy: { position: 'asc' },
    });

    // Conta deals por estágio (respeitando o escopo)
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stageId'],
      where: pipelineId ? { pipelineId } : { organizationId },
      _count: { stageId: true },
    });

    const dealsCountMap: Record<string, number> = {};
    dealsByStage.forEach(d => {
      dealsCountMap[d.stageId] = d._count.stageId;
    });

    return NextResponse.json({
      success: true,
      data: stages.map((stage) => ({
        ...stage,
        dealsCount: dealsCountMap[stage.id] || 0,
      })),
    });
  } catch (error) {
    console.error("[Pipeline Stages GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

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
    const organizationId = await getOrganizationId();
    
    // Valida membership (apenas ADMIN ou OWNER podem criar stages)
    const auth = await requireOrganizationMembership(organizationId);
    
    // Verifica permissão (opcional - descomentar se necessário)
    // requireRole(auth.membership, ['OWNER', 'ADMIN']);

    const body: CreateStagesBody = await request.json();
    const { stages, pipelineId } = body;

    console.log('[Pipeline Stages POST] Body:', body);

    // Valida pipeline se informado
    if (pipelineId) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: pipelineId, organizationId },
      });
      if (!pipeline) {
        return NextResponse.json(
          { success: false, error: "Pipeline not found" },
          { status: 404 }
        );
      }
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

    // Verifica se já existe um pipeline para esta organização (ou para o pipeline específico)
    const stageWhere = pipelineId ? { pipelineId } : { organizationId };
    const existingStagesCount = await prisma.pipelineStage.count({
      where: stageWhere,
    });

    const isFirstPipeline = existingStagesCount === 0;

    // Busca a última posição existente (se houver)
    const lastStage = await prisma.pipelineStage.findFirst({
      where: stageWhere,
      orderBy: { position: 'desc' },
    });

    const startPosition = lastStage ? lastStage.position + 1 : 0;

    // Cria todas as etapas
    const createdStages = await prisma.$transaction(
      stages.map((stage, index) => 
        prisma.pipelineStage.create({
          data: {
            organizationId,
            ...(pipelineId && { pipelineId }),
            name: stage.name.trim(),
            color: stage.color || DEFAULT_STAGE_COLOR,
            position: startPosition + index,
            probability: stage.probability ?? 0,
            isClosed: stage.isClosed ?? false,
            isDefault: isFirstPipeline && index === 0,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: createdStages,
      meta: {
        totalCreated: createdStages.length,
        isFirstPipeline,
        defaultStageId: isFirstPipeline ? createdStages[0]?.id : null,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[Pipeline Stages POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

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
    const organizationId = await getOrganizationId();
    
    // Valida membership
    await requireOrganizationMembership(organizationId);

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get("pipelineId");

    // Valida pipeline se informado
    if (pipelineId) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: pipelineId, organizationId },
      });
      if (!pipeline) {
        return NextResponse.json(
          { success: false, error: "Pipeline not found" },
          { status: 404 }
        );
      }
    }

    const stageWhere = pipelineId ? { pipelineId, organizationId } : { organizationId };

    // Conta quantas etapas serão removidas
    const stagesCount = await prisma.pipelineStage.count({
      where: stageWhere,
    });

    if (stagesCount === 0) {
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
    const stagesWithDeals = await prisma.pipelineStage.findMany({
      where: { 
        ...stageWhere,
        deals: { some: {} }
      },
      select: { id: true, name: true },
    });

    // Deleta todas as etapas da organização (ou do pipeline)
    const { count: deletedCount } = await prisma.pipelineStage.deleteMany({
      where: stageWhere,
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        organizationId,
      },
      meta: {
        warning: stagesWithDeals.length > 0 
          ? `Some stages had associated deals: ${stagesWithDeals.map(s => s.name).join(", ")}`
          : null,
      }
    });

  } catch (error) {
    console.error("[Pipeline Stages DELETE] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    // Tratamento específico para erro de constraint de FK
    if (error instanceof Error && error.message.includes("foreign key constraint")) {
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
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
