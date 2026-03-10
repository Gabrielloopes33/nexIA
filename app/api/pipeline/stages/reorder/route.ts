import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================
// TIPOS
// ============================================

interface StageOrder {
  stageId: string;
  newPosition: number;
}

interface ReorderStagesBody {
  stageOrders: StageOrder[];
}

// ============================================
// PATCH /api/pipeline/stages/reorder
// Reordena as etapas do pipeline
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const body: ReorderStagesBody = await request.json();
    const { stageOrders } = body;

    // Validação: stageOrders deve ser um array
    if (!Array.isArray(stageOrders)) {
      return NextResponse.json(
        { success: false, error: "stageOrders must be an array" },
        { status: 400 }
      );
    }

    // Validação: stageOrders não pode estar vazio
    if (stageOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "stageOrders cannot be empty" },
        { status: 400 }
      );
    }

    // Validação: cada item deve ter stageId e newPosition válidos
    const invalidItems = stageOrders.filter((item, index) => {
      if (!item.stageId || typeof item.stageId !== "string") {
        return { index, reason: "stageId is required and must be a string" };
      }
      if (typeof item.newPosition !== "number" || item.newPosition < 0 || !Number.isInteger(item.newPosition)) {
        return { index, reason: "newPosition must be a non-negative integer" };
      }
      return null;
    }).filter(Boolean);

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid stageOrders format",
          details: invalidItems
        },
        { status: 400 }
      );
    }

    // Verifica se há stageIds duplicados
    const stageIds = stageOrders.map(o => o.stageId);
    const duplicateIds = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Duplicate stageIds found",
          details: `Duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`
        },
        { status: 400 }
      );
    }

    // Verifica se há newPositions duplicados
    const positions = stageOrders.map(o => o.newPosition);
    const duplicatePositions = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    
    if (duplicatePositions.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Duplicate newPosition values found",
          details: `Each stage must have a unique position. Duplicates: ${[...new Set(duplicatePositions)].join(", ")}`
        },
        { status: 400 }
      );
    }

    // Busca as etapas existentes
    const stages = await prisma.pipelineStage.findMany({
      where: {
        id: {
          in: stageIds
        }
      }
    });

    // Verifica se todas as etapas existem
    if (stages.length !== stageIds.length) {
      const foundIds = stages.map(s => s.id);
      const notFoundIds = stageIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Some stages were not found",
          details: `Stage IDs not found: ${notFoundIds.join(", ")}`
        },
        { status: 404 }
      );
    }

    // Verifica se todas as etapas pertencem à mesma organização
    const organizationIds = [...new Set(stages.map(s => s.organizationId))];
    
    if (organizationIds.length > 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All stages must belong to the same organization",
          details: `Found stages from ${organizationIds.length} different organizations`
        },
        { status: 400 }
      );
    }

    const organizationId = organizationIds[0];

    // Busca todas as etapas da organização (incluindo as que não estão no reorder)
    const allOrgStages = await prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { position: "asc" }
    });

    // Separa as etapas que estão sendo reordenadas das que não estão
    const reorderIds = new Set(stageIds);
    const stagesNotInReorder = allOrgStages.filter(s => !reorderIds.has(s.id));

    // Cria um mapa de stageId -> newPosition
    const positionMap = new Map(stageOrders.map(o => [o.stageId, o.newPosition]));

    // Atualiza as posições em uma transação
    const updatedStages = await prisma.$transaction(async (tx) => {
      const updates: Array<{
        id: string;
        name: string;
        position: number;
        organizationId: string;
      }> = [];

      // Atualiza as etapas que estão sendo reordenadas
      for (const stage of stages) {
        const newPosition = positionMap.get(stage.id)!;
        
        await tx.pipelineStage.update({
          where: { id: stage.id },
          data: { position: newPosition }
        });

        updates.push({
          id: stage.id,
          name: stage.name,
          position: newPosition,
          organizationId: stage.organizationId
        });
      }

      // Reordena as etapas que não estão no reorder para o final
      // ou ajusta suas posições para evitar conflitos
      const maxNewPosition = Math.max(...positions);
      let currentPosition = maxNewPosition + 1;

      for (const stage of stagesNotInReorder) {
        await tx.pipelineStage.update({
          where: { id: stage.id },
          data: { position: currentPosition }
        });

        updates.push({
          id: stage.id,
          name: stage.name,
          position: currentPosition,
          organizationId: stage.organizationId
        });

        currentPosition++;
      }

      return updates;
    });

    // Retorna as etapas ordenadas pela nova posição
    const sortedStages = updatedStages.sort((a, b) => a.position - b.position);

    return NextResponse.json({
      success: true,
      data: sortedStages,
      meta: {
        organizationId,
        totalStages: sortedStages.length,
        reorderedCount: stages.length,
        adjustedCount: stagesNotInReorder.length
      }
    });

  } catch (error) {
    console.error("[Pipeline Stages Reorder] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to reorder pipeline stages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
