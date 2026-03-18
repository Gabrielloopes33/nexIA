#!/usr/bin/env tsx
/**
 * Fase 1 - Mapeamento de Endpoints
 * 
 * Este script mapeia todos os endpoints da API que precisam ser refatorados
 * para não aceitar organizationId do cliente.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

interface EndpointIssue {
  file: string;
  line: number;
  type: 'QUERY_PARAM' | 'BODY_PARAM' | 'FALLBACK_ORG';
  description: string;
  code: string;
}

const ENDPOINTS_DIR = './app/api';
const issues: EndpointIssue[] = [];

function findRouteFiles(dir: string, files: string[] = []): string[] {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findRouteFiles(fullPath, files);
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Padrões a procurar
  const patterns = [
    {
      regex: /organizationId.*=.*searchParams\.get\s*\(\s*['"]organizationId['"]\s*\)/i,
      type: 'QUERY_PARAM' as const,
      description: 'organizationId via query param'
    },
    {
      regex: /organizationId.*=.*body\./i,
      type: 'BODY_PARAM' as const,
      description: 'organizationId via body'
    },
    {
      regex: /organizationId.*===?\s*['"]default_org_id['"]/i,
      type: 'FALLBACK_ORG' as const,
      description: 'Fallback para organização default'
    },
    {
      regex: /from\(['"]organizations['"]\).*limit\s*\(\s*1\s*\)/i,
      type: 'FALLBACK_ORG' as const,
      description: 'Busca organização aleatória como fallback'
    }
  ];
  
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        issues.push({
          file: relative('.', filePath),
          line: index + 1,
          type: pattern.type,
          description: pattern.description,
          code: line.trim()
        });
      }
    }
  });
}

function main() {
  console.log('🔍 Fase 1 - Mapeamento de Endpoints\n');
  console.log('Analisando endpoints em:', ENDPOINTS_DIR);
  
  const routeFiles = findRouteFiles(ENDPOINTS_DIR);
  console.log(`Encontrados ${routeFiles.length} arquivos de rota\n`);
  
  for (const file of routeFiles) {
    analyzeFile(file);
  }
  
  // Agrupa por tipo
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, EndpointIssue[]>);
  
  // Relatório
  console.log('📊 RELATÓRIO DE ENDPOINTS\n');
  console.log('=' .repeat(80));
  
  for (const [type, typeIssues] of Object.entries(byType)) {
    console.log(`\n## ${type} (${typeIssues.length} ocorrências)\n`);
    
    // Agrupa por arquivo
    const byFile = typeIssues.reduce((acc, issue) => {
      acc[issue.file] = acc[issue.file] || [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, EndpointIssue[]>);
    
    for (const [file, fileIssues] of Object.entries(byFile)) {
      console.log(`\n  📁 ${file}`);
      for (const issue of fileIssues) {
        console.log(`     Linha ${issue.line}: ${issue.description}`);
        console.log(`     → ${issue.code.substring(0, 60)}${issue.code.length > 60 ? '...' : ''}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 RESUMO:');
  console.log(`   Total de arquivos analisados: ${routeFiles.length}`);
  console.log(`   Total de issues encontradas: ${issues.length}`);
  
  // Lista prioritária (endpoints mais críticos)
  const criticalEndpoints = [
    'app/api/contacts/route.ts',
    'app/api/pipeline/deals/route.ts',
    'app/api/pipeline/stages/route.ts',
    'app/api/conversations/route.ts',
    'app/api/webhooks/form-submission/route.ts',
  ];
  
  console.log('\n🔴 ENDPOINTS CRÍTICOS (prioridade alta):');
  for (const endpoint of criticalEndpoints) {
    const hasIssues = issues.some(i => i.file.includes(endpoint.replace('app/api/', '')));
    console.log(`   ${hasIssues ? '⚠️' : '✅'} ${endpoint}`);
  }
}

main();
