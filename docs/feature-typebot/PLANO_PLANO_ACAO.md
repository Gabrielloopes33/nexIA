# PLANO DE IMPLEMENTAÇÃO - Plano de Ação Lançamento
## Feature: Integração com CRM NexIA (Envio Automático de PDF)

---

## 1. Visão Geral

### Objetivo
Implementar integração completa entre o sistema **Plano de Ação Lançamento** e o **CRM NexIA**, permitindo o envio automático de PDFs gerados diretamente para os leads via WhatsApp através do CRM.

### Escopo
- Modificação do fluxo de webhook do Typebot para incluir envio ao CRM
- Criação de sistema de storage para PDFs acessíveis publicamente
- Implementação de mapeamento dinâmico telefone → tenant/organização no CRM
- **PDFs são mantidos permanentemente** (não há deleção automática)

### Fluxo Completo
```
1. Recebe POST /api/webhook/typebot do Typebot
   
2. Gera diagnóstico com GPT-4o-mini

3. Salva Aluno e Dossie no banco

4. Gera PDF em memória (@react-pdf/renderer)
   → Salva em: /public/pdfs/{dossieId}.pdf

5. Resolve tenant pelo telefone (mapeamento DDD → organizationId:instanceId)

6. Chama CRM: POST /api/webhooks/form-submission
   Payload: { organizationId, instanceId, templateName, leadData, 
              pdfUrl: "https://plano-de-acao.com/pdfs/{id}.pdf", ... }

7. Retorna resposta ao Typebot com status do envio

8. PDF permanece disponível para download futuro
```

---

## 2. Agentes AIOS Responsáveis

| Agente | Papel | Responsabilidades |
|--------|-------|-------------------|
| **@architect** | Arquitetura & Design | Definir estrutura de arquivos, padrões de integração, decisões técnicas, revisão de segurança |
| **@dev** | Desenvolvimento | Implementar integrações, endpoints, funções utilitárias |
| **@qa** | Qualidade & Testes | Testes de integração, validação de fluxo end-to-end, testes de carga, segurança |
| **@pm** | Gestão do Produto | Este plano, alinhamento de requisitos, priorização, documentação |
| **@devops** | Deploy & Infra | Configuração de variáveis de ambiente, monitoramento |

---

## 3. Arquitetura e Decisões Técnicas

### 3.1 Fluxo de Dados

```
FLUXO ATUAL (ANTES):
Typebot → POST /api/webhook/typebot → GPT-4 → PDF → DB (Aluno/Dossie)
                                              ↓
                                        Download manual

FLUXO NOVO (DEPOIS):
Typebot → POST /api/webhook/typebot → GPT-4 → PDF → DB (Aluno/Dossie)
                                              ↓
                                    Salva em /public/pdfs/{id}.pdf
                                              ↓
                                    Resolve tenant (telefone→org:instance)
                                              ↓
                                    POST /api/webhooks/form-submission (CRM)
                                              ↓
                                    Retorna resposta ao Typebot
                                              ↓
                                    PDF permanece disponível
```

### 3.2 Decisões Técnicas (@architect)

| Decisão | Justificativa |
|---------|---------------|
| **Storage em disco** (`/public/pdfs/`) | Simplicidade, acesso direto via URL, sem custo adicional vs S3/R2 |
| **Manter PDFs permanentemente** | Permite download futuro pelo aluno; simplifica arquitetura |
| **Mapeamento via DDD (2 primeiros dígitos)** | Padrão brasileiro permite segmentação por região/operadora |
| **Retry pattern (3 tentativas)** | Resiliência contra falhas transientes de rede |
| **Secret compartilhado** | Autenticação simples e eficaz entre serviços na mesma VPS |
| **Fallback: não bloquear fluxo** | Se CRM falhar, PDF ainda é gerado e salvo (não perde dados) |

### 3.3 Diagrama de Sequência

```
┌─────────┐     ┌─────────────────┐     ┌─────────────┐     ┌──────────┐
│ Typebot │     │ Plano de Ação   │     │    PDFs     │     │ CRM NexIA│
└────┬────┘     └────────┬────────┘     └──────┬──────┘     └────┬─────┘
     │                   │                     │                  │
     │ POST /webhook     │                     │                  │
     │──────────────────>│                     │                  │
     │                   │                     │                  │
     │                   │──┐ Gera Diagnóstico │                  │
     │                   │  │ (GPT-4)          │                  │
     │                   │<─┘                  │                  │
     │                   │                     │                  │
     │                   │──┐ Gera PDF         │                  │
     │                   │  │ (@react-pdf)     │                  │
     │                   │<─┘                  │                  │
     │                   │                     │                  │
     │                   │───── Salva PDF ─────>│                  │
     │                   │   /pdfs/{id}.pdf    │                  │
     │                   │                     │                  │
     │                   │──┐ Resolve Tenant   │                  │
     │                   │  │ (telefone→org)   │                  │
     │                   │<─┘                  │                  │
     │                   │                     │                  │
     │                   │───── POST /webhooks/form-submission ───>│
     │                   │   {pdfUrl, leadData, ...}               │
     │                   │                     │                  │
     │                   │<────────────────────│                  │
     │                   │   {success: true}   │                  │
     │                   │                     │                  │
     │  {success: true,  │                     │                  │
     │   pdfUrl, crm}    │                     │                  │
     │<──────────────────│                     │                  │
     │                   │                     │                  │
     │                   │                     │<── GET /pdfs/{id}│
     │                   │                     │   (CRM baixa)    │
     │                   │                     │                  │
     │                   │                     │──> PDF Data      │
     │                   │                     │                  │
     │                   │                     │◄─────────────────│
     │                   │                     │   (PDF permanece)│
```

---

## 4. Arquivos

### 4.1 Novos Arquivos

| Arquivo | Agente | Descrição | Complexidade |
|---------|--------|-----------|--------------|
| `lib/crm-integration.ts` | @dev | Cliente HTTP para CRM NexIA com retry logic, tipagem de payloads, função `sendToCRM()` | Média |
| `lib/tenant-mapping.ts` | @dev | Mapeamento DDD → {organizationId, instanceId}, função `resolveTenantByPhone()` | Baixa |
| `lib/pdf-storage.ts` | @dev | Abstração para salvar/buscar PDFs | Baixa |
| `src/app/api/pdfs/[id]/route.ts` | @dev | Endpoint GET para servir PDFs (público) | Baixa |
| `lib/types/crm.ts` | @architect | Tipagens TypeScript para payloads do CRM | Baixa |

### 4.2 Arquivos Modificados

| Arquivo | Agente | O que muda | Impacto |
|---------|--------|------------|---------|
| `src/app/api/webhook/typebot/route.ts` | @dev | Adicionar chamada ao CRM após geração do PDF, salvar PDF em disco | Alto |
| `prisma/schema.prisma` | @architect | Adicionar campos: `Dossie.pdfUrl`, `Dossie.sentToCrmAt`, `Dossie.crmResponse` | Médio |
| `.env.local` | @dev | Adicionar variáveis: `CRM_API_URL`, `CRM_SECRET`, `TENANT_MAP_*` | - |
| `next.config.js` | @architect | Configurar headers de cache para `/pdfs/*` | Baixo |
| `package.json` | @dev | (sem alterações - não há mais script de cleanup) | - |
| `.gitignore` | @dev | Adicionar `/public/pdfs/` (exceto .gitkeep) | Baixo |

---

## 5. Tasks de Implementação

### 🔷 Fase 1 - Configuração e Storage (@architect + @dev)

#### 5.1.1 Setup Inicial
- [ ] **TASK-001**: Revisar schema Prisma e propor migração para campos de rastreamento CRM (@architect)
- [ ] **TASK-002**: Definir estrutura de tipos TypeScript para integração CRM em `lib/types/crm.ts` (@architect)
- [ ] **TASK-003**: Configurar headers de cache no `next.config.js` para rota `/pdfs/*` (@architect)
- [ ] **TASK-004**: Criar diretório `/public/pdfs/` e adicionar ao `.gitignore` (@dev)

#### 5.1.2 Implementação de Storage
- [ ] **TASK-005**: Criar `lib/pdf-storage.ts` com funções:
  ```typescript
  export async function savePdf(dossieId: string, pdfBuffer: Buffer): Promise<string>
  export async function getPdf(dossieId: string): Promise<Buffer | null>
  export async function pdfExists(dossieId: string): Promise<boolean>
  ```
- [ ] **TASK-006**: Criar endpoint `GET /api/pdfs/[id]/route.ts` para servir PDFs
- [ ] **TASK-007**: Adicionar tratamento de erro 404 quando PDF não existir

### 🔷 Fase 2 - Integração com CRM (@dev)

#### 5.2.1 Mapeamento de Tenants
- [ ] **TASK-008**: Criar `lib/tenant-mapping.ts` com estrutura:
  ```typescript
  interface TenantConfig {
    organizationId: string;
    instanceId: string;
    templateName: string;
    templateLanguage: string;
  }
  
  export function resolveTenantByPhone(phone: string): TenantConfig | null
  ```
- [ ] **TASK-009**: Implementar mapeamento inicial de DDDs (ex: 11→SP, 21→RJ, etc.)
- [ ] **TASK-010**: Adicionar fallback para DDD não mapeado (usar default tenant)

#### 5.2.2 Cliente CRM
- [ ] **TASK-011**: Criar `lib/crm-integration.ts` com:
  ```typescript
  interface CRMPayload {
    secret: string;
    organizationId: string;
    instanceId: string;
    templateName: string;
    templateLanguage: string;
    templateVariables: string[];
    leadData: {
      nome: string;
      email?: string;
      telefone: string;
    };
    pdfUrl: string;
    pdfFilename: string;
    dossieId: string;
    alunoId: string;
    source: string;
    timestamp: string;
  }
  
  export async function sendToCRM(payload: CRMPayload): Promise<CRMResponse>
  ```
- [ ] **TASK-012**: Implementar retry logic com exponential backoff (3 tentativas: 1s, 2s, 4s)
- [ ] **TASK-013**: Implementar timeout de 10s por requisição
- [ ] **TASK-014**: Adicionar logging estruturado para sucesso/falha

#### 5.2.3 Modificação do Webhook
- [ ] **TASK-015**: Modificar `src/app/api/webhook/typebot/route.ts`:
  - Após gerar PDF, salvar em `/public/pdfs/{dossieId}.pdf`
  - Chamar `resolveTenantByPhone()` com telefone do aluno
  - Se tenant encontrado, chamar `sendToCRM()`
  - Atualizar registro do Dossie com `pdfUrl`, `sentToCrmAt`, `crmResponse`
  - Retornar resposta apropriada ao Typebot (incluir status do envio CRM)
- [ ] **TASK-016**: Garantir que falha no CRM não quebre o fluxo (try/catch + log)
- [ ] **TASK-017**: Adicionar métricas: tempo total de processamento, status do envio CRM

### 🔷 Fase 3 - Testes e Validação (@qa)

#### 5.3.1 Testes Unitários
- [ ] **TASK-018**: Testar `resolveTenantByPhone()` com vários DDDs
- [ ] **TASK-019**: Testar `savePdf()`
- [ ] **TASK-020**: Testar retry logic do cliente CRM (mockar falhas)

#### 5.3.2 Testes de Integração
- [ ] **TASK-021**: Testar fluxo completo: Typebot → PDF → CRM (mockar CRM)
- [ ] **TASK-022**: Testar comportamento quando CRM está offline (deve salvar PDF mesmo assim)
- [ ] **TASK-023**: Testar endpoint de PDF (acesso, 404, cache)
- [ ] **TASK-024**: Testar concorrência: múltiplos webhooks simultâneos

#### 5.3.3 Testes End-to-End
- [ ] **TASK-025**: Testar com Typebot real em ambiente de staging
- [ ] **TASK-026**: Verificar se CRM recebe payload correto
- [ ] **TASK-027**: Verificar se PDF é acessível via URL pública
- [ ] **TASK-028**: Verificar se PDF permanece disponível após envio ao CRM

#### 5.3.4 Testes de Segurança
- [ ] **TASK-029**: Tentar acessar PDF sem ID válido (deve retornar 404)
- [ ] **TASK-030**: Verificar path traversal em `[id]` (tentar `../../../etc/passwd`)
- [ ] **TASK-031**: Verificar se variáveis sensíveis não aparecem em logs

---

## 6. Configuração do Typebot

### 6.1 Webhook Configurado no Typebot

**URL**: `https://plano-de-acao.com/api/webhook/typebot`

**Método**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body (exemplo)**:
```json
{
  "nome": "{{Nome}}",
  "email": "{{Email}}",
  "telefone": "{{Telefone}}",
  "profissao": "{{Profissao}}",
  "nicho": "{{Nicho}}",
  "habilidades": "{{Habilidades}}",
  "objetivos": "{{Objetivos}}",
  "desafios": "{{Desafios}}"
}
```

### 6.2 Tratamento de Resposta no Typebot

O webhook agora retorna:

```json
{
  "success": true,
  "alunoId": "aluno_abc123",
  "dossieId": "dossie_xyz789",
  "pdfGenerated": true,
  "pdfUrl": "https://plano-de-acao.com/pdfs/dossie_xyz789.pdf",
  "crm": {
    "sent": true,
    "organizationId": "org_abc123",
    "instanceId": "inst_xyz789",
    "message": "Enviado com sucesso para o CRM"
  }
}
```

**Variáveis a capturar no Typebot**:
- `{{pdfUrl}}` → `response.pdfUrl`
- `{{crmSent}}` → `response.crm.sent`
- `{{dossieId}}` → `response.dossieId`

### 6.3 Fluxo Condicional no Typebot

```
[Webhook] 
    ↓
[Check: {{crmSent}} == true]
    ↓ SIM                    ↓ NÃO
[Msg: "Seu Plano      [Msg: "Seu Plano
foi enviado        foi gerado!
para seu WhatsApp! Baixe aqui: {{pdfUrl}}"
Em breve você      
receberá uma     
mensagem."]
```

---

## 7. Variáveis de Ambiente

### 7.1 Novas Variáveis (.env.local)

```bash
# ============================================
# INTEGRAÇÃO CRM NEXIA
# ============================================

# URL base da API do CRM NexIA
CRM_API_URL=https://crm.nexia.com/api

# Secret compartilhado para autenticação com CRM
CRM_SECRET=sk_live_nexia_xxxxxxxxxxxxxxxx

# Timeout para chamadas ao CRM (ms)
CRM_TIMEOUT_MS=10000

# Número de retries em caso de falha
CRM_MAX_RETRIES=3

# ============================================
# STORAGE DE PDFs
# ============================================

# Diretório para PDFs (relativo à raiz do projeto)
PDF_DIR=public/pdfs

# URL base pública para acesso aos PDFs
PDF_BASE_URL=https://plano-de-acao.com/pdfs

# ============================================
# MAPEAMENTO DE TENANTS (CRM Organizations)
# ============================================

# Formato: DDD=organizationId:instanceId
# Múltiplos DDDs separados por vírgula
TENANT_MAP_11=org_sp_001:inst_whatsapp_001
TENANT_MAP_21=org_rj_001:inst_whatsapp_002
TENANT_MAP_31=org_mg_001:inst_whatsapp_003

# Tenant padrão para DDDs não mapeados
TENANT_DEFAULT=org_default:inst_default

# Template de WhatsApp a usar
WHATSAPP_TEMPLATE_NAME=plano_acao_envio
WHATSAPP_TEMPLATE_LANGUAGE=pt_BR
```

### 7.2 Exemplo Completo (.env.local.example)

```bash
# ============================================
# EXISTENTES (já configurados)
# ============================================

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...

# Webhook Secret (já existe para Typebot)
WEBHOOK_SECRET=whsec_...

# ============================================
# NOVOS - INTEGRAÇÃO CRM
# ============================================

# CRM NexIA
CRM_API_URL=https://crm.nexia.com/api
CRM_SECRET=your_shared_secret_here
CRM_TIMEOUT_MS=10000
CRM_MAX_RETRIES=3

# PDFs
PDF_BASE_URL=https://seu-dominio.com/pdfs

# Tenant Mapping (exemplo para SP, RJ, MG)
TENANT_MAP_11=org_sp_main:inst_whatsapp_sp
TENANT_MAP_12=org_sp_main:inst_whatsapp_sp
TENANT_MAP_21=org_rj_main:inst_whatsapp_rj
TENANT_MAP_22=org_rj_main:inst_whatsapp_rj
TENANT_MAP_31=org_mg_main:inst_whatsapp_mg
TENANT_MAP_32=org_mg_main:inst_whatsapp_mg
TENANT_DEFAULT=org_default:inst_default

# Template WhatsApp
WHATSAPP_TEMPLATE_NAME=plano_acao_envio
WHATSAPP_TEMPLATE_LANGUAGE=pt_BR
```

---

## 8. Mapeamento de Tenants (DDD → CRM)

### 8.1 Estrutura de Mapeamento

O mapeamento é feito pelos **2 primeiros dígitos** do telefone (DDD brasileiro):

```typescript
// lib/tenant-mapping.ts

const DEFAULT_TENANT = {
  organizationId: process.env.TENANT_DEFAULT?.split(':')[0] || 'org_default',
  instanceId: process.env.TENANT_DEFAULT?.split(':')[1] || 'inst_default',
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'plano_acao_envio',
  templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'pt_BR',
};

const DDD_TENANT_MAP: Record<string, { organizationId: string; instanceId: string }> = {
  // São Paulo (11, 12, 13, 14, 15, 16, 17, 18, 19)
  '11': { organizationId: 'org_sp_001', instanceId: 'inst_sp_main' },
  '12': { organizationId: 'org_sp_001', instanceId: 'inst_sp_main' },
  // ... outros DDDs de SP
  
  // Rio de Janeiro (21, 22, 24)
  '21': { organizationId: 'org_rj_001', instanceId: 'inst_rj_main' },
  '22': { organizationId: 'org_rj_001', instanceId: 'inst_rj_main' },
  
  // Minas Gerais (31, 32, 33, 34, 35, 37, 38)
  '31': { organizationId: 'org_mg_001', instanceId: 'inst_mg_main' },
  
  // Paraná (41, 42, 43, 44, 45, 46)
  '41': { organizationId: 'org_pr_001', instanceId: 'inst_pr_main' },
  
  // ... outros estados
};

export function resolveTenantByPhone(phone: string): TenantConfig | null {
  // Limpar telefone (remover não-dígitos)
  const cleaned = phone.replace(/\D/g, '');
  
  // Extrair DDD (2 primeiros dígitos após 55, ou primeiros 2)
  let ddd: string;
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    ddd = cleaned.substring(2, 4);
  } else if (cleaned.length >= 10) {
    ddd = cleaned.substring(0, 2);
  } else {
    console.warn(`[TenantMapping] Telefone inválido: ${phone}`);
    return null;
  }
  
  // Buscar no mapa
  const tenant = DDD_TENANT_MAP[ddd];
  
  if (!tenant) {
    console.warn(`[TenantMapping] DDD não mapeado: ${ddd}, usando default`);
    return {
      ...DEFAULT_TENANT,
    };
  }
  
  return {
    ...tenant,
    templateName: DEFAULT_TENANT.templateName,
    templateLanguage: DEFAULT_TENANT.templateLanguage,
  };
}
```

### 8.2 Tabela de Mapeamento Completo

| Região | DDDs | Organization ID | Instance ID |
|--------|------|-----------------|-------------|
| **São Paulo** | 11, 12, 13, 14, 15, 16, 17, 18, 19 | `org_sp_001` | `inst_sp_main` |
| **Rio de Janeiro** | 21, 22, 24 | `org_rj_001` | `inst_rj_main` |
| **Minas Gerais** | 31, 32, 33, 34, 35, 37, 38 | `org_mg_001` | `inst_mg_main` |
| **Paraná** | 41, 42, 43, 44, 45, 46 | `org_pr_001` | `inst_pr_main` |
| **Rio Grande do Sul** | 51, 53, 54, 55 | `org_rs_001` | `inst_rs_main` |
| **Bahia** | 71, 73, 74, 75, 77 | `org_ba_001` | `inst_ba_main` |
| **Pernambuco** | 81, 87 | `org_pe_001` | `inst_pe_main` |
| **Ceará** | 85, 88 | `org_ce_001` | `inst_ce_main` |
| **Goiás** | 62, 64 | `org_go_001` | `inst_go_main` |
| **Distrito Federal** | 61 | `org_df_001` | `inst_df_main` |
| **Default** | Outros | `org_default` | `inst_default` |

### 8.3 Exemplo de Uso

```typescript
const phone = '5511999999999';
const tenant = resolveTenantByPhone(phone);
// Resultado:
// {
//   organizationId: 'org_sp_001',
//   instanceId: 'inst_sp_main',
//   templateName: 'plano_acao_envio',
//   templateLanguage: 'pt_BR'
// }
```

---

## 9. Critérios de Aceite

### 9.1 Funcionais

| ID | Critério | Como Validar |
|----|----------|--------------|
| **CA-001** | Webhook do Typebot continua funcionando | Testar formulário completo |
| **CA-002** | PDF é gerado e salvo em `/public/pdfs/{id}.pdf` | Verificar diretório no servidor |
| **CA-003** | PDF é acessível via URL pública | `curl $PDF_BASE_URL/{id}.pdf` |
| **CA-004** | PDF permanece disponível após envio ao CRM | Verificar após 24h |
| **CA-005** | Mapeamento resolve corretamente pelo DDD | Testar com telefones de diferentes regiões |
| **CA-006** | Payload é enviado ao CRM com todos os campos | Verificar logs do CRM |
| **CA-007** | Se CRM falhar, PDF ainda é salvo (não quebra fluxo) | Desligar CRM e testar |
| **CA-008** | Registro do Dossie é atualizado com `pdfUrl` | Query no banco |
| **CA-009** | Typebot recebe resposta com status do CRM | Verificar variável `{{crmSent}}` |

### 9.2 Não-Funcionais

| ID | Critério | Métrica |
|----|----------|---------|
| **CA-010** | Tempo total de processamento webhook | < 15 segundos |
| **CA-011** | Disponibilidade do endpoint de PDF | 99.9% |
| **CA-012** | Retry do CRM em caso de falha | 3 tentativas |
| **CA-013** | Tempo de resposta do endpoint PDF | < 500ms |

### 9.3 Segurança

| ID | Critério |
|----|----------|
| **CA-014** | Path traversal é bloqueado em `[id]` |
| **CA-015** | Secrets não aparecem em logs |
| **CA-016** | Rate limiting aplicado ao webhook |

---

## 10. Troubleshooting

### 10.1 Problemas Comuns e Soluções

#### 🔴 PDF não está sendo gerado

**Sintomas**: Endpoint `/api/pdfs/[id]` retorna 404

**Verificações**:
1. Verificar logs do webhook: `grep "PDF generation" logs.txt`
2. Confirmar diretório existe: `ls -la public/pdfs/`
3. Verificar permissões de escrita: `chmod 755 public/pdfs/`

**Solução**:
```bash
# Criar diretório se não existir
mkdir -p public/pdfs
chmod 755 public/pdfs
```

---

#### 🔴 CRM não está recebendo o lead

**Sintomas**: `crm.sent: false` na resposta do webhook

**Verificações**:
1. Verificar se `CRM_API_URL` está configurado corretamente
2. Verificar se `CRM_SECRET` está correto
3. Verificar logs de erro do CRM: `grep "CRM Error" logs.txt`
4. Testar conectividade: `curl -I $CRM_API_URL`

**Solução**:
```bash
# Testar manualmente
curl -X POST $CRM_API_URL/webhooks/form-submission \
  -H "Content-Type: application/json" \
  -d '{"secret":"'$CRM_SECRET'","test":true}'
```

---

#### 🔴 Tenant não está sendo resolvido

**Sintomas**: Sempre usando tenant default

**Verificações**:
1. Verificar formato do telefone recebido do Typebot
2. Verificar se DDD está no mapeamento: `grep "TenantMapping" logs.txt`
3. Confirmar variáveis `TENANT_MAP_*` estão configuradas

**Solução**:
```typescript
// Adicionar log de debug
console.log('[TenantMapping] Input:', phone, 'DDD:', ddd, 'Tenant:', tenant);
```

---

### 10.2 Comandos Úteis para Debug

```bash
# Verificar status do sistema
echo "=== PDFs gerados ==="
ls -la public/pdfs/ | wc -l

echo "=== Últimos PDFs ==="
ls -lt public/pdfs/ | head -5

echo "=== Logs do webhook ==="
tail -100 logs.txt | grep "webhook/typebot"

echo "=== Logs do CRM ==="
tail -100 logs.txt | grep "CRM"

echo "=== Testar integração ==="
curl -X POST http://localhost:3000/api/webhook/typebot \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"test@email.com","telefone":"5511999999999","profissao":"Teste","nicho":"Teste","habilidades":"Teste","objetivos":"Teste","desafios":"Teste"}'
```

---

### 10.3 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas em produção
- [ ] Diretório `public/pdfs/` criado com permissões corretas
- [ ] Migração do Prisma executada
- [ ] Webhook do Typebot atualizado (se necessário)
- [ ] CRM NexIA configurado para aceitar requests do domínio
- [ ] Teste end-to-end realizado
- [ ] Monitoramento configurado (logs, alertas)
- [ ] Documentação atualizada
- [ ] Rollback plan definido

---

### 10.4 Migração Prisma

```prisma
// Adicionar ao schema.prisma

model Dossie {
  id           String   @id @default(cuid())
  alunoId      String
  conteudo     String
  versao       Int      @default(1)
  createdAt    DateTime @default(now())
  
  // NOVOS CAMPOS
  pdfUrl       String?   // URL do PDF gerado
  sentToCrmAt  DateTime? // Quando foi enviado ao CRM
  crmResponse  Json?     // Resposta do CRM
  crmError     String?   // Erro se houver
  
  aluno        Aluno    @relation(fields: [alunoId], references: [id], onDelete: Cascade)
  chatMessages ChatMessage[]

  @@index([alunoId])
}
```

---

**Plano criado por**: @pm  
**Revisão técnica**: @architect  
**Data**: 2024-01-15  
**Versão**: 2.0 (atualizado - sem cleanup, PDFs permanentes)
