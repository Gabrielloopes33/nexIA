#!/usr/bin/env ts-node
/**
 * Seed Script: Pipeline Templates
 *
 * Popula o banco de dados com templates pré-definidos de pipelines
 * para diferentes categorias de negócio.
 *
 * Uso:
 *   npx ts-node scripts/seed-pipeline-templates.ts
 *
 * Ou com tsx (mais rápido):
 *   npx tsx scripts/seed-pipeline-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// DEFINIÇÃO DOS TEMPLATES
// ============================================

interface StageDefinition {
  name: string;
  color: string;
  probability: number;
  isClosed?: boolean;
  description?: string;
}

interface TemplateDefinition {
  name: string;
  category: string;
  description: string;
  isDefault?: boolean;
  stages: StageDefinition[];
}

const pipelineTemplates: TemplateDefinition[] = [
  {
    name: 'Infoprodutos',
    category: 'infoprodutos',
    description: 'Pipeline otimizado para vendas de cursos, ebooks e infoprodutos digitais',
    stages: [
      {
        name: 'Lead Capturado',
        color: '#3b82f6',
        probability: 10,
        description: 'Lead entrou no funil através de alguma ação de marketing',
      },
      {
        name: 'Lead Engajado',
        color: '#6366f1',
        probability: 25,
        description: 'Lead demonstrou interesse e interagiu com conteúdos',
      },
      {
        name: 'Lead Qualificado',
        color: '#8b5cf6',
        probability: 40,
        description: 'Lead foi qualificado e tem fit com o produto',
      },
      {
        name: 'Oportunidade',
        color: '#a855f7',
        probability: 60,
        description: 'Lead demonstrou intenção de compra',
      },
      {
        name: 'Negociação',
        color: '#d946ef',
        probability: 75,
        description: 'Em processo de negociação e esclarecimento de dúvidas',
      },
      {
        name: 'Convertido',
        color: '#22c55e',
        probability: 100,
        isClosed: true,
        description: 'Venda realizada com sucesso',
      },
      {
        name: 'Perdido',
        color: '#ef4444',
        probability: 0,
        isClosed: true,
        description: 'Oportunidade perdida',
      },
      {
        name: 'Cliente Ativo',
        color: '#10b981',
        probability: 100,
        description: 'Cliente que comprou e está ativo',
      },
      {
        name: 'Upsell',
        color: '#f59e0b',
        probability: 80,
        description: 'Oportunidade de venda adicional ou upgrade',
      },
      {
        name: 'Inativo',
        color: '#6b7280',
        probability: 0,
        description: 'Cliente sem atividade recente',
      },
    ],
  },
  {
    name: 'Negócios Físicos',
    category: 'negocios-fisicos',
    description: 'Pipeline para vendas B2B e negócios com processo de vendas presencial',
    stages: [
      {
        name: 'Lead Capturado',
        color: '#3b82f6',
        probability: 10,
        description: 'Lead entrou no funil',
      },
      {
        name: 'Primeiro Contato',
        color: '#6366f1',
        probability: 25,
        description: 'Primeira interação realizada com o lead',
      },
      {
        name: 'Orçamento',
        color: '#8b5cf6',
        probability: 40,
        description: 'Orçamento enviado para análise',
      },
      {
        name: 'Visita',
        color: '#a855f7',
        probability: 55,
        description: 'Visita técnica ou apresentação presencial agendada',
      },
      {
        name: 'Negociação',
        color: '#d946ef',
        probability: 70,
        description: 'Em negociação de condições e valores',
      },
      {
        name: 'Convertido',
        color: '#22c55e',
        probability: 100,
        isClosed: true,
        description: 'Venda fechada com sucesso',
      },
      {
        name: 'Perdido',
        color: '#ef4444',
        probability: 0,
        isClosed: true,
        description: 'Negócio perdido para concorrência ou outro motivo',
      },
      {
        name: 'Recorrente',
        color: '#10b981',
        probability: 100,
        description: 'Cliente com compras recorrentes',
      },
      {
        name: 'Promotor',
        color: '#f59e0b',
        probability: 100,
        description: 'Cliente que indica novos negócios',
      },
      {
        name: 'Inativo',
        color: '#6b7280',
        probability: 0,
        description: 'Cliente sem compras recentes',
      },
    ],
  },
  {
    name: 'Saúde',
    category: 'saude',
    description: 'Pipeline específico para clínicas, consultórios e serviços de saúde',
    stages: [
      {
        name: 'Lead Capturado',
        color: '#3b82f6',
        probability: 10,
        description: 'Paciente potencial capturado',
      },
      {
        name: 'Triagem',
        color: '#6366f1',
        probability: 30,
        description: 'Triagem inicial realizada',
      },
      {
        name: 'Agendamento',
        color: '#8b5cf6',
        probability: 50,
        description: 'Consulta ou avaliação agendada',
      },
      {
        name: 'Avaliação',
        color: '#a855f7',
        probability: 65,
        description: 'Avaliação ou primeira consulta realizada',
      },
      {
        name: 'Negociação',
        color: '#d946ef',
        probability: 75,
        description: 'Discussão de plano de tratamento e valores',
      },
      {
        name: 'Convertido',
        color: '#22c55e',
        probability: 100,
        isClosed: true,
        description: 'Paciente iniciou tratamento',
      },
      {
        name: 'Em Tratamento',
        color: '#10b981',
        probability: 100,
        description: 'Paciente em acompanhamento ativo',
      },
      {
        name: 'Concluído',
        color: '#06b6d4',
        probability: 100,
        isClosed: true,
        description: 'Tratamento concluído com sucesso',
      },
      {
        name: 'Recorrente',
        color: '#f59e0b',
        probability: 100,
        description: 'Paciente com retornos periódicos',
      },
      {
        name: 'Perdido',
        color: '#ef4444',
        probability: 0,
        isClosed: true,
        description: 'Paciente desistiu ou não compareceu',
      },
    ],
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

function logWarning(message: string) {
  console.warn(`⚠️  ${message}`);
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function seedPipelineTemplates() {
  console.log('\n🌱 Iniciando seed de Pipeline Templates...\n');

  try {
    // Verifica templates existentes
    const existingCount = await prisma.pipelineTemplate.count();
    
    if (existingCount > 0) {
      logWarning(`Já existem ${existingCount} templates no banco de dados.`);
      
      // Pergunta se deseja recriar (em ambiente não-interativo, podemos forçar com flag)
      const forceRecreate = process.argv.includes('--force');
      
      if (forceRecreate) {
        logInfo('Flag --force detectada. Recriando todos os templates...');
        
        // Deleta estágios primeiro (por causa da FK)
        await prisma.pipelineTemplateStage.deleteMany();
        logSuccess('Estágios antigos removidos');
        
        // Deleta templates
        await prisma.pipelineTemplate.deleteMany();
        logSuccess('Templates antigos removidos');
      } else {
        logInfo('Use --force para recriar os templates ou pule a criação.');
        console.log('\n⚡ Para recriar: npx ts-node scripts/seed-pipeline-templates.ts --force\n');
        return;
      }
    }

    // Cria os templates e estágios
    for (const templateDef of pipelineTemplates) {
      logInfo(`Criando template: ${templateDef.name} (${templateDef.category})`);

      const template = await prisma.pipelineTemplate.create({
        data: {
          name: templateDef.name,
          category: templateDef.category,
          description: templateDef.description,
          isDefault: templateDef.isDefault ?? false,
          stages: {
            create: templateDef.stages.map((stage, index) => ({
              name: stage.name,
              position: index + 1,
              color: stage.color,
              probability: stage.probability,
              isClosed: stage.isClosed ?? false,
              description: stage.description,
            })),
          },
        },
        include: {
          stages: true,
        },
      });

      logSuccess(
        `Template "${template.name}" criado com ${template.stages.length} estágios`
      );
    }

    // Resumo final
    const totalTemplates = await prisma.pipelineTemplate.count();
    const totalStages = await prisma.pipelineTemplateStage.count();

    console.log('\n' + '='.repeat(50));
    console.log('✨ Seed concluído com sucesso!');
    console.log('='.repeat(50));
    console.log(`📊 Templates criados: ${totalTemplates}`);
    console.log(`📊 Estágios criados: ${totalStages}`);
    console.log('\nTemplates disponíveis:');
    
    const templates = await prisma.pipelineTemplate.findMany({
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    for (const t of templates) {
      console.log(`\n  📁 ${t.name} (${t.category})`);
      console.log(`     ${t.description}`);
      console.log(`     ${t.stages.length} estágios:`);
      for (const s of t.stages) {
        const closedBadge = s.isClosed ? ' [FECHADO]' : '';
        console.log(`       ${s.position}. ${s.name} (${s.probability}%)${closedBadge}`);
      }
    }

    console.log('\n');
  } catch (error) {
    logError('Erro durante o seed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// EXECUÇÃO
// ============================================

seedPipelineTemplates();
