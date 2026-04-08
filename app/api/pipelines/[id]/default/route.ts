import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRLS } from "@/lib/db/rls";
import { 
  getAuthenticatedUser,
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";
import type { PipelineType } from "@/types/pipeline-config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pipelines/[id]/default
 * Define um pipeline como padrão da organização
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const { id } = await params;

    console.log('[Pipeline Default POST] Params:', { id, organizationId });

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se o pipeline existe e pertence à organização
      const existingPipeline = await tx.pipeline.findFirst({
        where: { 
          id, 
          organizationId,
          status: "ACTIVE",
        },
      });

      if (!existingPipeline) {
        throw new Error("Pipeline não encontrado ou inativo");
      }

      // Remove o status de padrão de todos os outros pipelines da organização
      await tx.pipeline.updateMany({
        where: { 
          organizationId, 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });

      // Define este pipeline como padrão
      const updatedPipeline = await tx.pipeline.update({
        where: { id },
        data: { isDefault: true },
        include: {
          stages: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              position: true,
              color: true,
              probability: true,
              isDefault: true,
              isClosed: true,
            },
          },
          product: {
            select: { id: true, name: true, color: true },
          },
          _count: {
            select: { deals: true },
          },
        },
      });

      return updatedPipeline;
    });

    // Transforma para o formato esperado
    const transformedPipeline = {
      id: result.id,
      name: result.name,
      color: result.product?.color || "#6366f1",
      type: (result.product?.name?.toLowerCase().includes('venda') ? 'vendas' : 
             result.product?.name?.toLowerCase().includes('follow') ? 'follow_up' :
             result.product?.name?.toLowerCase().includes('pos') ? 'pos_venda' : 'outro') as PipelineType,
      isActive: result.status === "ACTIVE",
      isDefault: result.isDefault,
      stages: result.stages,
      organizationId: result.organizationId,
      productId: result.productId,
      product: result.product,
      _count: {
        deals: result._count.deals,
        automations: 0,
      },
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    console.log('[Pipeline Default POST] Set as default:', { id: transformedPipeline.id, name: transformedPipeline.name });

    return NextResponse.json({
      success: true,
      data: transformedPipeline,
      message: "Pipeline definido como padrão com sucesso",
    });
  } catch (error) {
    console.error("[Pipeline Default POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error && error.message === "Pipeline não encontrado ou inativo") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to set default pipeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
