import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

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
  organizationId: string;
  customName?: string;
}

// ============================================
// Templates Pré-definidos em Memória
// ============================================
const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "infoprodutos-v1",
    name: "Pipeline de Infoprodutos",
    category: "infoprodutos",
    description: "Processo completo de vendas para cursos, mentorias e produtos digitais",
    stages: [
      {
        name: "Lead Capturado",
        position: 0,
        color: "#94a3b8", // slate-400
        probability: 10,
        isDefault: true,
        isClosed: false,
      },
      {
        name: "Lead Engajado",
        position: 1,
        color: "#60a5fa", // blue-400
        probability: 20,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Lead Qualificado",
        position: 2,
        color: "#3b82f6", // blue-500
        probability: 35,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Oportunidade (Mão Levantada)",
        position: 3,
        color: "#8b5cf6", // violet-500
        probability: 50,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Negociação / Objeção",
        position: 4,
        color: "#f59e0b", // amber-500
        probability: 70,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Convertido (Novo Cliente)",
        position: 5,
        color: "#22c55e", // green-500
        probability: 100,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Perdido",
        position: 6,
        color: "#ef4444", // red-500
        probability: 0,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Cliente Ativo (pós-venda)",
        position: 7,
        color: "#10b981", // emerald-500
        probability: 100,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Upsell / Ascensão",
        position: 8,
        color: "#06b6d4", // cyan-500
        probability: 80,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Inativo / Churn",
        position: 9,
        color: "#6b7280", // gray-500
        probability: 0,
        isDefault: false,
        isClosed: true,
      },
    ],
  },
  {
    id: "negocios-fisicos-v1",
    name: "Pipeline de Negócios Físicos",
    category: "negocios-fisicos",
    description: "Processo de vendas para lojas, serviços locais e comércio físico",
    stages: [
      {
        name: "Lead Capturado",
        position: 0,
        color: "#94a3b8", // slate-400
        probability: 10,
        isDefault: true,
        isClosed: false,
      },
      {
        name: "Primeiro Contato",
        position: 1,
        color: "#60a5fa", // blue-400
        probability: 25,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Orçamento / Proposta",
        position: 2,
        color: "#3b82f6", // blue-500
        probability: 40,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Visita / Experiência",
        position: 3,
        color: "#8b5cf6", // violet-500
        probability: 55,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Negociação",
        position: 4,
        color: "#f59e0b", // amber-500
        probability: 75,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Convertido (Cliente)",
        position: 5,
        color: "#22c55e", // green-500
        probability: 100,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Perdido",
        position: 6,
        color: "#ef4444", // red-500
        probability: 0,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Cliente Recorrente",
        position: 7,
        color: "#10b981", // emerald-500
        probability: 100,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Promotor / Indicador",
        position: 8,
        color: "#14b8a6", // teal-500
        probability: 100,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Inativo / Sumiu",
        position: 9,
        color: "#6b7280", // gray-500
        probability: 0,
        isDefault: false,
        isClosed: true,
      },
    ],
  },
  {
    id: "saude-v1",
    name: "Pipeline de Saúde",
    category: "saude",
    description: "Processo de atendimento para clínicas, consultórios e profissionais de saúde",
    stages: [
      {
        name: "Lead Capturado",
        position: 0,
        color: "#94a3b8", // slate-400
        probability: 10,
        isDefault: true,
        isClosed: false,
      },
      {
        name: "Triagem / Pré-qualificação",
        position: 1,
        color: "#60a5fa", // blue-400
        probability: 30,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Agendamento",
        position: 2,
        color: "#818cf8", // indigo-400
        probability: 50,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Avaliação / Consulta",
        position: 3,
        color: "#8b5cf6", // violet-500
        probability: 65,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Negociação / Decisão",
        position: 4,
        color: "#f59e0b", // amber-500
        probability: 80,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Convertido (Tratamento Iniciado)",
        position: 5,
        color: "#22c55e", // green-500
        probability: 100,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Em Tratamento / Acompanhamento",
        position: 6,
        color: "#10b981", // emerald-500
        probability: 100,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Concluído / Pós-Alta",
        position: 7,
        color: "#14b8a6", // teal-500
        probability: 100,
        isDefault: false,
        isClosed: true,
      },
      {
        name: "Recorrente / Indicador",
        position: 8,
        color: "#06b6d4", // cyan-500
        probability: 100,
        isDefault: false,
        isClosed: false,
      },
      {
        name: "Perdido / Inativo",
        position: 9,
        color: "#6b7280", // gray-500
        probability: 0,
        isDefault: false,
        isClosed: true,
      },
    ],
  },
];

// ============================================
// GET /api/pipeline/templates
// Retorna todos os templates disponíveis
// ============================================
export async function GET() {
  try {
    // Retorna templates sem os dados sensíveis/internos
    const templates = PIPELINE_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      stageCount: template.stages.length,
      stages: template.stages.map((stage) => ({
        name: stage.name,
        position: stage.position,
        color: stage.color,
        probability: stage.probability,
        isDefault: stage.isDefault,
        isClosed: stage.isClosed,
      })),
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
    const body: ApplyTemplateRequest = await request.json();

    // Validação dos campos obrigatórios
    if (!body.templateId || typeof body.templateId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Campo obrigatório: templateId",
        },
        { status: 400 }
      );
    }

    if (!body.organizationId || typeof body.organizationId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Campo obrigatório: organizationId",
        },
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
          availableTemplates: PIPELINE_TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
          })),
        },
        { status: 404 }
      );
    }

    // Verifica se já existem etapas para esta organização
    const { data: existingStages, error: checkError } = await supabaseServer
      .from('PipelineStage')
      .select('*')
      .eq('organizationId', body.organizationId)
      .order('position', { ascending: true });

    if (checkError) {
      console.error('[PIPELINE_TEMPLATES_APPLY] Error checking existing stages:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao verificar etapas existentes",
          message: checkError.message,
        },
        { status: 500 }
      );
    }

    if (existingStages && existingStages.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta organização já possui etapas de pipeline configuradas",
          existingStages: existingStages.map((s) => ({
            id: s.id,
            name: s.name,
            position: s.position,
          })),
        },
        { status: 409 }
      );
    }

    // Cria as etapas do pipeline baseado no template
    const stagesToCreate = template.stages.map((stage) => ({
      organizationId: body.organizationId,
      name: stage.name,
      position: stage.position,
      color: stage.color,
      probability: stage.probability,
      isDefault: stage.isDefault,
      isClosed: stage.isClosed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { data: createdStages, error: insertError } = await supabaseServer
      .from('PipelineStage')
      .insert(stagesToCreate)
      .select();

    if (insertError) {
      console.error('[PIPELINE_TEMPLATES_APPLY] Error creating stages:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao criar etapas do pipeline",
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Pipeline "${body.customName || template.name}" criado com sucesso`,
        data: {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          customName: body.customName || null,
          organizationId: body.organizationId,
          stagesCreated: createdStages.length,
          stages: createdStages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            position: stage.position,
            color: stage.color,
            probability: stage.probability,
            isDefault: stage.isDefault,
            isClosed: stage.isClosed,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PIPELINE_TEMPLATES_APPLY] Error:", error);
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
