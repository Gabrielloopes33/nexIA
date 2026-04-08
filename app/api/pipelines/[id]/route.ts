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
 * GET /api/pipelines/[id]
 * Retorna um pipeline específico com seus estágios
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    console.log('[Pipeline GET] Params:', { id, organizationId });

    const pipeline = await withRLS(prisma, organizationId, async (tx) => {
      return tx.pipeline.findUnique({
        where: { 
          id,
          organizationId,
        },
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
            select: { 
              deals: true,
            },
          },
        },
      });
    });

    if (!pipeline) {
      return NextResponse.json(
        { success: false, error: "Pipeline não encontrado" },
        { status: 404 }
      );
    }

    // Transforma para o formato esperado
    const transformedPipeline = {
      id: pipeline.id,
      name: pipeline.name,
      color: pipeline.product?.color || "#6366f1",
      type: (pipeline.product?.name?.toLowerCase().includes('venda') ? 'vendas' : 
             pipeline.product?.name?.toLowerCase().includes('follow') ? 'follow_up' :
             pipeline.product?.name?.toLowerCase().includes('pos') ? 'pos_venda' : 'outro') as PipelineType,
      isActive: pipeline.status === "ACTIVE",
      isDefault: pipeline.isDefault,
      stages: pipeline.stages,
      organizationId: pipeline.organizationId,
      productId: pipeline.productId,
      product: pipeline.product,
      _count: {
        deals: pipeline._count.deals,
        automations: 0,
      },
      createdAt: pipeline.createdAt.toISOString(),
      updatedAt: pipeline.updatedAt.toISOString(),
    };

    console.log('[Pipeline GET] Returning pipeline:', { id: transformedPipeline.id, name: transformedPipeline.name });

    return NextResponse.json({
      success: true,
      data: transformedPipeline,
    });
  } catch (error) {
    console.error("[Pipeline GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch pipeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pipelines/[id]
 * Atualiza um pipeline
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    
    const {
      name,
      color,
      isActive,
      isDefault,
    } = body;

    console.log('[Pipeline PATCH] Params:', { id, organizationId });
    console.log('[Pipeline PATCH] Body:', body);

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se o pipeline existe
      const existingPipeline = await tx.pipeline.findFirst({
        where: { id, organizationId },
      });

      if (!existingPipeline) {
        throw new Error("Pipeline não encontrado");
      }

      // Se for definido como padrão, remove o padrão dos outros
      if (isDefault === true) {
        await tx.pipeline.updateMany({
          where: { 
            organizationId, 
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      // Atualiza o pipeline
      const updatedPipeline = await tx.pipeline.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(isActive !== undefined && { status: isActive ? "ACTIVE" : "INACTIVE" }),
          ...(isDefault !== undefined && { isDefault }),
        },
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
      color: result.product?.color || color || "#6366f1",
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

    console.log('[Pipeline PATCH] Updated pipeline:', { id: transformedPipeline.id, name: transformedPipeline.name });

    return NextResponse.json({
      success: true,
      data: transformedPipeline,
    });
  } catch (error) {
    console.error("[Pipeline PATCH] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error && error.message === "Pipeline não encontrado") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update pipeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pipelines/[id]
 * Remove um pipeline (soft delete - marca como inativo)
 * Nunca deleta se tiver deals associados
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    console.log('[Pipeline DELETE] Params:', { id, organizationId });

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se o pipeline existe
      const existingPipeline = await tx.pipeline.findFirst({
        where: { id, organizationId },
        include: {
          _count: {
            select: { deals: true },
          },
        },
      });

      if (!existingPipeline) {
        throw new Error("Pipeline não encontrado");
      }

      // Verifica se tem deals associados
      if (existingPipeline._count.deals > 0) {
        throw new Error("Não é possível excluir um pipeline que possui negócios associados");
      }

      // Soft delete - marca como inativo
      const updatedPipeline = await tx.pipeline.update({
        where: { id },
        data: {
          status: "INACTIVE",
          isDefault: false, // Remove o status de padrão
        },
        include: {
          stages: {
            orderBy: { position: 'asc' },
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
      _count: {
        deals: result._count.deals,
        automations: 0,
      },
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    console.log('[Pipeline DELETE] Deactivated pipeline:', { id: transformedPipeline.id, name: transformedPipeline.name });

    return NextResponse.json({
      success: true,
      data: transformedPipeline,
      message: "Pipeline desativado com sucesso",
    });
  } catch (error) {
    console.error("[Pipeline DELETE] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error) {
      if (error.message === "Pipeline não encontrado") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes("negócios associados")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete pipeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
