import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getOrganizationId, 
  requireOrganizationMembership,
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";

// ============================================
// Tipos
// ============================================
interface PipelineStageTemplate {
  name: string;
  position: number;
  color: string;
  probability: number;
  isDefault: boolean;
  isClosed: boolean;
}

interface PipelineTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  stages: PipelineStageTemplate[];
}

interface ApplyTemplateRequest {
  templateId: string;
  customName?: string;
  productId: string;
}

// ============================================
// Templates Pré-definidos em Memória
// ============================================
const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "follow-up-v1",
    name: "Pipeline de Follow Up / Pós-venda",
    category: "follow-up",
    description: "Processo de acompanhamento pós-venda, onboarding e retenção de clientes",
    stages: [
      { name: "Novo Cliente", position: 0, color: "#22c55e", probability: 100, isDefault: true, isClosed: false },
      { name: "Onboarding", position: 1, color: "#3b82f6", probability: 100, isDefault: false, isClosed: false },
      { name: "Implementação", position: 2, color: "#8b5cf6", probability: 90, isDefault: false, isClosed: false },
      { name: "Adoção / Uso Ativo", position: 3, color: "#06b6d4", probability: 85, isDefault: false, isClosed: false },
      { name: "Suporte Técnico", position: 4, color: "#f59e0b", probability: 80, isDefault: false, isClosed: false },
      { name: "Renovação / Upsell", position: 5, color: "#10b981", probability: 70, isDefault: false, isClosed: false },
      { name: "Cliente Fidelizado", position: 6, color: "#14b8a6", probability: 95, isDefault: false, isClosed: false },
      { name: "Churn / Cancelado", position: 7, color: "#ef4444", probability: 0, isDefault: false, isClosed: true },
      { name: "Inativo", position: 8, color: "#6b7280", probability: 0, isDefault: false, isClosed: true },
    ],
  },
  {
    id: "infoprodutos-v1",
    name: "Pipeline de Infoprodutos",
    category: "infoprodutos",
    description: "Processo completo de vendas para cursos, mentorias e produtos digitais",
    stages: [
      { name: "Lead Capturado", position: 0, color: "#94a3b8", probability: 10, isDefault: true, isClosed: false },
      { name: "Lead Engajado", position: 1, color: "#60a5fa", probability: 20, isDefault: false, isClosed: false },
      { name: "Lead Qualificado", position: 2, color: "#3b82f6", probability: 35, isDefault: false, isClosed: false },
      { name: "Oportunidade (Mão Levantada)", position: 3, color: "#8b5cf6", probability: 50, isDefault: false, isClosed: false },
      { name: "Negociação / Objeção", position: 4, color: "#f59e0b", probability: 70, isDefault: false, isClosed: false },
      { name: "Convertido (Novo Cliente)", position: 5, color: "#22c55e", probability: 100, isDefault: false, isClosed: true },
      { name: "Perdido", position: 6, color: "#ef4444", probability: 0, isDefault: false, isClosed: true },
      { name: "Cliente Ativo (pós-venda)", position: 7, color: "#10b981", probability: 100, isDefault: false, isClosed: false },
      { name: "Upsell / Ascensão", position: 8, color: "#06b6d4", probability: 80, isDefault: false, isClosed: false },
      { name: "Inativo / Churn", position: 9, color: "#6b7280", probability: 0, isDefault: false, isClosed: true },
    ],
  },
  {
    id: "negocios-fisicos-v1",
    name: "Pipeline de Negócios Físicos",
    category: "negocios-fisicos",
    description: "Processo de vendas para lojas, serviços locais e comércio físico",
    stages: [
      { name: "Lead Capturado", position: 0, color: "#94a3b8", probability: 10, isDefault: true, isClosed: false },
      { name: "Primeiro Contato", position: 1, color: "#60a5fa", probability: 25, isDefault: false, isClosed: false },
      { name: "Orçamento / Proposta", position: 2, color: "#3b82f6", probability: 40, isDefault: false, isClosed: false },
      { name: "Visita / Experiência", position: 3, color: "#8b5cf6", probability: 55, isDefault: false, isClosed: false },
      { name: "Negociação", position: 4, color: "#f59e0b", probability: 75, isDefault: false, isClosed: false },
      { name: "Convertido (Cliente)", position: 5, color: "#22c55e", probability: 100, isDefault: false, isClosed: true },
      { name: "Perdido", position: 6, color: "#ef4444", probability: 0, isDefault: false, isClosed: true },
      { name: "Cliente Recorrente", position: 7, color: "#10b981", probability: 100, isDefault: false, isClosed: false },
      { name: "Promotor / Indicador", position: 8, color: "#14b8a6", probability: 100, isDefault: false, isClosed: false },
      { name: "Inativo / Sumiu", position: 9, color: "#6b7280", probability: 0, isDefault: false, isClosed: true },
    ],
  },
  {
    id: "saude-v1",
    name: "Pipeline de Saúde",
    category: "saude",
    description: "Processo de atendimento para clínicas, consultórios e profissionais de saúde",
    stages: [
      { name: "Lead Capturado", position: 0, color: "#94a3b8", probability: 10, isDefault: true, isClosed: false },
      { name: "Triagem / Pré-qualificação", position: 1, color: "#60a5fa", probability: 30, isDefault: false, isClosed: false },
      { name: "Agendamento", position: 2, color: "#818cf8", probability: 50, isDefault: false, isClosed: false },
      { name: "Avaliação / Consulta", position: 3, color: "#8b5cf6", probability: 65, isDefault: false, isClosed: false },
      { name: "Negociação / Decisão", position: 4, color: "#f59e0b", probability: 80, isDefault: false, isClosed: false },
      { name: "Convertido (Tratamento Iniciado)", position: 5, color: "#22c55e", probability: 100, isDefault: false, isClosed: true },
      { name: "Em Tratamento / Acompanhamento", position: 6, color: "#10b981", probability: 100, isDefault: false, isClosed: false },
      { name: "Concluído / Pós-Alta", position: 7, color: "#14b8a6", probability: 100, isDefault: false, isClosed: true },
      { name: "Recorrente / Indicador", position: 8, color: "#06b6d4", probability: 100, isDefault: false, isClosed: false },
      { name: "Perdido / Inativo", position: 9, color: "#6b7280", probability: 0, isDefault: false, isClosed: true },
    ],
  },
];

// ============================================
// GET /api/pipeline/templates
// Retorna todos os templates disponíveis
// ============================================
export async function GET() {
  try {
    const templates = PIPELINE_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      stageCount: template.stages.length,
      stages: template.stages,
    }));

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        categories: [...new Set(templates.map((t) => t.category))],
      },
    });
  } catch (error) {
    console.error("[PIPELINE_TEMPLATES_GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao carregar templates",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/pipeline/templates/apply
// Aplica um template criando as etapas no banco
// ============================================
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    
    // Valida membership
    await requireOrganizationMembership(organizationId);

    console.log('[PIPELINE_TEMPLATES_APPLY] Request received');
    
    const body: ApplyTemplateRequest = await request.json();
    console.log('[PIPELINE_TEMPLATES_APPLY] Body:', JSON.stringify(body, null, 2));

    // Validação dos campos obrigatórios
    if (!body.templateId || typeof body.templateId !== "string") {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: templateId" },
        { status: 400 }
      );
    }

    // Busca o template
    const template = PIPELINE_TEMPLATES.find((t) => t.id === body.templateId);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Template não encontrado",
          availableTemplates: PIPELINE_TEMPLATES.map((t) => ({ id: t.id, name: t.name })),
        },
        { status: 404 }
      );
    }

    // Verifica se o productId foi fornecido
    if (!body.productId || typeof body.productId !== "string") {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: productId" },
        { status: 400 }
      );
    }

    // Verifica se o produto existe e pertence à organização
    const product = await prisma.product.findFirst({
      where: { 
        id: body.productId,
        organizationId 
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado ou não pertence à organização" },
        { status: 404 }
      );
    }

    // Cria o pipeline primeiro
    const pipeline = await prisma.pipeline.create({
      data: {
        organizationId,
        productId: body.productId,
        name: body.customName || template.name,
        isDefault: false,
        status: "ACTIVE",
      },
    });

    console.log('[PIPELINE_TEMPLATES_APPLY] Created pipeline:', pipeline.id);

    // Cria as etapas do pipeline baseado no template
    const createdStages = await prisma.$transaction(
      template.stages.map((stage) =>
        prisma.pipelineStage.create({
          data: {
            organizationId,
            pipelineId: pipeline.id,
            name: stage.name,
            position: stage.position,
            color: stage.color,
            probability: stage.probability,
            isDefault: stage.isDefault,
            isClosed: stage.isClosed,
          },
        })
      )
    );

    console.log('[PIPELINE_TEMPLATES_APPLY] Created stages:', createdStages.length);

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          category: template.category,
        },
        stages: createdStages,
        meta: {
          totalCreated: createdStages.length,
          organizationId,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error("[PIPELINE_TEMPLATES_APPLY] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao aplicar template",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
