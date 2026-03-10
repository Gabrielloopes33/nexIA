import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const stages = await prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
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

// ============================================
// POST /api/pipeline/stages
// Cria múltiplas etapas do pipeline de uma vez
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateStagesBody = await request.json();
    const { organizationId, stages } = body;

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

    // Verifica se já existe um pipeline para esta organização
    const existingStagesCount = await prisma.pipelineStage.count({
      where: { organizationId }
    });

    const isFirstPipeline = existingStagesCount === 0;

    // Busca a última posição existente (se houver)
    const lastStage = await prisma.pipelineStage.findFirst({
      where: { organizationId },
      orderBy: { position: "desc" },
    });

    const startPosition = lastStage ? lastStage.position + 1 : 0;

    // Prepara os dados para criação em batch
    const stagesData = stages.map((stage, index) => ({
      organizationId,
      name: stage.name.trim(),
      color: stage.color || DEFAULT_STAGE_COLOR,
      position: startPosition + index,
      probability: stage.probability ?? 0,
      isClosed: stage.isClosed ?? false,
      isDefault: isFirstPipeline && index === 0, // Primeira etapa é default se for o primeiro pipeline
    }));

    // Cria todas as etapas em uma transação
    const createdStages = await prisma.$transaction(
      stagesData.map(data => prisma.pipelineStage.create({ data }))
    );

    return NextResponse.json({
      success: true,
      data: createdStages,
      meta: {
        totalCreated: createdStages.length,
        isFirstPipeline,
        defaultStageId: isFirstPipeline ? createdStages[0].id : null,
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

    // Conta quantas etapas serão removidas
    const stagesCount = await prisma.pipelineStage.count({
      where: { organizationId }
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
      where: { organizationId },
      include: {
        _count: {
          select: { deals: true }
        }
      }
    });

    const stagesWithDealsList = stagesWithDeals.filter(s => s._count.deals > 0);

    // Deleta todas as etapas da organização
    // Nota: Se houver deals, a operação falhará devido às constraints de FK
    // dependendo de como o schema está configurado (onDelete)
    const deleteResult = await prisma.pipelineStage.deleteMany({
      where: { organizationId }
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
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
    
    // Tratamento específico para erro de constraint de FK (P2003)
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isForeignKeyError = errorMessage.includes("P2003") || errorMessage.includes("foreign key constraint");
    
    if (isForeignKeyError) {
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
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
