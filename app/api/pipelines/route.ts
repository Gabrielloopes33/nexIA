import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRLS } from "@/lib/db/rls";
import { 
  getAuthenticatedUser,
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";
import type { PipelineType } from "@/types/pipeline-config";

/**
 * GET /api/pipelines
 * Lista pipelines da organização com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get("productId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    console.log('[Pipelines GET] Params:', { organizationId, productId, includeInactive });

    const result = await withRLS(prisma, organizationId, async (tx) => {
      const where: any = { organizationId };
      
      if (productId) {
        where.productId = productId;
      }
      
      if (!includeInactive) {
        where.status = "ACTIVE";
      }

      // Busca pipelines
      const pipelines = await tx.pipeline.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
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

      // Busca stages separadamente para contornar possíveis problemas de RLS
      const pipelineIds = pipelines.map(p => p.id);
      const stages = await tx.pipelineStage.findMany({
        where: {
          pipelineId: { in: pipelineIds },
        },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          position: true,
          color: true,
          probability: true,
          isDefault: true,
          isClosed: true,
          pipelineId: true,
        },
      });

      // Agrupa stages por pipeline
      const stagesByPipeline = stages.reduce((acc, stage) => {
        if (!acc[stage.pipelineId!]) acc[stage.pipelineId!] = [];
        acc[stage.pipelineId!].push(stage);
        return acc;
      }, {} as Record<string, typeof stages>);

      // Adiciona stages aos pipelines
      const pipelinesWithStages = pipelines.map(p => ({
        ...p,
        stages: stagesByPipeline[p.id] || [],
      }));

      const [totalCount, defaultPipeline] = await Promise.all([
        tx.pipeline.count({ where }),
        tx.pipeline.findFirst({
          where: { organizationId, isDefault: true },
          select: { id: true },
        }),
      ]);

      return { pipelines: pipelinesWithStages, totalCount, defaultPipelineId: defaultPipeline?.id ?? null };
    });

    // Transforma os dados para o formato esperado
    const transformedPipelines = result.pipelines.map((pipeline) => ({
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
        automations: 0, // Será preenchido se necessário
      },
      createdAt: pipeline.createdAt.toISOString(),
      updatedAt: pipeline.updatedAt.toISOString(),
    }));

    console.log('[Pipelines GET] Returning pipelines:', transformedPipelines.map(p => ({ 
      id: p.id, 
      name: p.name, 
      stagesCount: p.stages?.length || 0
    })));

    return NextResponse.json({
      success: true,
      data: {
        pipelines: transformedPipelines,
        totalCount: result.totalCount,
        defaultPipelineId: result.defaultPipelineId,
      },
    });
  } catch (error) {
    console.error("[Pipelines GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch pipelines",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipelines
 * Cria um novo pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const body = await request.json();
    
    const {
      name,
      color,
      productId,
      isDefault = false,
      stages = [],
    } = body;

    console.log('[Pipelines POST] Body:', body);
    console.log('[Pipelines POST] User:', { userId: user.userId, organizationId });

    // Validações
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Nome do pipeline é obrigatório" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "ProductId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se já existe pipeline com o mesmo nome para este produto
      const existingPipeline = await tx.pipeline.findFirst({
        where: { 
          organizationId,
          productId,
          name,
        },
      });

      if (existingPipeline) {
        throw new Error("Já existe um pipeline com este nome para este produto");
      }

      // Se for definido como padrão, remove o padrão dos outros pipelines
      if (isDefault) {
        await tx.pipeline.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Cria o pipeline
      const pipeline = await tx.pipeline.create({
        data: {
          organizationId,
          productId,
          name,
          isDefault,
          status: "ACTIVE",
        },
        include: {
          product: {
            select: { id: true, name: true, color: true },
          },
          stages: true,
        },
      });

      // Cria os estágios iniciais se fornecidos
      if (stages.length > 0) {
        await tx.pipelineStage.createMany({
          data: stages.map((stage: any, index: number) => ({
            organizationId,
            pipelineId: pipeline.id,
            name: stage.name,
            position: stage.position ?? index,
            color: stage.color,
            probability: stage.probability ?? 0,
            isDefault: stage.isDefault ?? false,
            isClosed: stage.isClosed ?? false,
          })),
        });
      }

      // Retorna o pipeline com os estágios criados
      return tx.pipeline.findUnique({
        where: { id: pipeline.id },
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
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Falha ao criar pipeline" },
        { status: 500 }
      );
    }

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
      _count: {
        deals: result._count.deals,
        automations: 0,
      },
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    console.log('[Pipelines POST] Created pipeline:', { id: transformedPipeline.id, name: transformedPipeline.name });

    return NextResponse.json({
      success: true,
      data: transformedPipeline,
    });
  } catch (error) {
    console.error("[Pipelines POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error && error.message.includes("Já existe")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create pipeline",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
