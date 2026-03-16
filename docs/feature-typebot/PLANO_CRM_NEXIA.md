# PLANO DE IMPLEMENTAÇÃO - CRM NexIA
## Feature: Integração com Plano de Ação (Typebot)

---

## 1. Visão Geral

### Objetivo
Implementar sistema completo para receber webhooks do sistema "plano-de-acao-lancamento" e enviar PDFs automaticamente via WhatsApp usando a Meta Cloud API.

### Escopo
- Criar endpoint seguro para receber webhooks de formulários
- Implementar sistema de entrega agendada (esperar `delivered` antes de enviar PDF)
- Fazer upload de PDFs para Meta API
- Gerenciar estado de entregas pendentes
- **Interface de gerenciamento na sidebar** da API Oficial Meta

### Fluxo Completo
```
1. Recebe POST /api/webhooks/form-submission do plano-de-acao
   Payload: { organizationId, instanceId, templateName, leadData, pdfUrl, ... }
   
2. Valida secret, cria/atualiza Contact, inicia Conversation

3. Envia Template Message via Meta API
   → Salva PendingFormDelivery (status: WAITING)

4. Aguarda webhook "delivered" da Meta (async)

5. Ao receber delivered:
   → Baixa PDF da URL temporária
   → Upload para Meta API (media upload resumable)
   → Envia Document Message com media_id
   → Atualiza status para COMPLETED
   
6. PDF é mantido no sistema de origem (não precisa deletar)
```

---

## 2. Agentes AIOS Responsáveis

| Agente | Papel | Responsabilidades |
|--------|-------|-------------------|
| **@architect** | Arquitetura & Schema | Design do schema Prisma, decisões técnicas (ADRs), revisão de arquitetura, tipagens TypeScript, interface da sidebar |
| **@dev** | Desenvolvimento | Implementar endpoints, helpers, integração com Meta API, retry logic, logging, componentes React |
| **@qa** | Qualidade & Testes | Testes E2E, testes de carga, validação de edge cases, segurança |
| **@pm** | Gestão do Produto | Coordenação, requisitos, priorização, aprovação do plano |
| **@devops** | Deploy & Infra | Configuração de variáveis de ambiente, monitoramento, alertas |

---

## 3. Arquitetura e Decisões Técnicas

### 3.1 Diagrama de Estados

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
START ──► WAITING ◄──────────────────────────────► EXPIRED
            │                                        (24h)
            │ (recebe delivered)
            ▼
      PROCESSING ──► (erro retryable) ──► WAITING
            │
            │ (sucesso)
            ▼
       COMPLETED
            │
            │ (erro final)
            ▼
         FAILED
```

### 3.2 Decisões Técnicas (@architect)

| Decisão | Justificativa |
|---------|---------------|
| **Postgres para estado** | Zero infra nova, banco já existe, sufficiente para volume inicial |
| **Esperar `delivered`** | Meta exige janela de 24h aberta para documentos; evita erro 131026 |
| **Upload resumable Meta** | Necessário para arquivos > 5MB; obtém media_id para envio |
| **Baixar PDF temporariamente** | Meta não aceita URL externa diretamente; precisa fazer upload |
| **Manter PDFs no sistema de origem** | Simplifica arquitetura; plano-de-acao já gerencia seus PDFs |
| **Interface na sidebar** | Centraliza gerenciamento na API Oficial Meta; fácil acesso |
| **Retry com backoff** | Resiliência contra falhas transientes de rede/Meta API |

### 3.3 Diagrama de Sequência

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│Plano de Ação│     │   CRM NexIA │     │    Meta     │     │   WhatsApp  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ POST /webhooks    │                   │                   │
       │ /form-submission  │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │──┐ Cria Contact   │                   │
       │                   │  │ Cria Conversation                  │
       │                   │<─┘                 │                   │
       │                   │                   │                   │
       │                   │───── Send Template Message ──────────>│
       │                   │   (abre janela 24h)                   │
       │                   │                   │                   │
       │                   │<──────── message_id ──────────────────│
       │                   │                   │                   │
       │                   │──┐ Salva PendingFormDelivery          │
       │                   │  │ (status: WAITING)                  │
       │                   │<─┘                 │                   │
       │                   │                   │                   │
       │  {success: true}  │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │<──────── webhook delivered ───────────│
       │                   │   (janela aberta)                     │
       │                   │                   │                   │
       │                   │──┐ Atualiza para PROCESSING            │
       │                   │<─┘                 │                   │
       │                   │                   │                   │
       │<──────── GET /temp-pdfs/{id} ────────│                   │
       │                   │                   │                   │
       │─── PDF Buffer ───>│                   │                   │
       │                   │                   │                   │
       │                   │───── Upload Resumable ────────────────>│
       │                   │   (obtém media_id)                    │
       │                   │                   │                   │
       │                   │<──────── media_id ────────────────────│
       │                   │                   │                   │
       │                   │───── Send Document Message ──────────>│
       │                   │   (com media_id)  │                   │
       │                   │                   │                   │
       │                   │                   │───── PDF ─────────>│
       │                   │                   │                   │
       │                   │──┐ Atualiza para COMPLETED             │
       │                   │<─┘                 │                   │
       │                   │                   │                   │
       │                   │                   │                   │
```

---

## 4. Interface na Sidebar - API Oficial Meta

### 4.1 Nova Seção: "Envio de Formulários" (@architect + @dev)

Adicionar nova seção na sidebar da página "API Oficial Meta":

```
API Oficial Meta
├── Visão Geral
├── Instâncias
├── Templates
├── Envio de Mensagens
├── Logs
└── 📋 Envio de Formulários  ← NOVO
    ├── Dashboard
    ├── Entregas Pendentes
    ├── Histórico
    └── Configurações
```

### 4.2 Páginas da Interface

#### 4.2.1 Dashboard (`/dashboard/whatsapp/form-submissions`)

**Componentes:**
- Cards de estatísticas:
  - Total de envios hoje
  - Taxa de sucesso
  - Pendentes (aguardando delivered)
  - Falhas nas últimas 24h
- Gráfico de envios ao longo do tempo
- Lista dos últimos envios com status

**Agente:** @dev

#### 4.2.2 Entregas Pendentes (`/dashboard/whatsapp/form-submissions/pending`)

**Funcionalidades:**
- Tabela com todas as entregas em status WAITING/PROCESSING
- Filtros: por organização, por data, por status
- Ações: 
  - Reprocessar manualmente
  - Cancelar envio
  - Ver detalhes do lead
- Auto-refresh a cada 30 segundos

**Colunas da tabela:**
| Coluna | Descrição |
|--------|-----------|
| Data | Quando foi recebido |
| Lead | Nome + telefone |
| Organização | Qual org no CRM |
| Template | Nome do template usado |
| Status | Badge colorido (WAITING/PROCESSING/COMPLETED/FAILED) |
| Ações | Botões de reprocessar/cancelar |

**Agente:** @dev

#### 4.2.3 Histórico (`/dashboard/whatsapp/form-submissions/history`)

**Funcionalidades:**
- Tabela com todas as entregas (COMPLETED/FAILED/EXPIRED)
- Filtros avançados: por data, status, organização, lead
- Exportar para CSV
- Paginação

**Agente:** @dev

#### 4.2.4 Configurações (`/dashboard/whatsapp/form-submissions/settings`)

**Funcionalidades:**
- Configurar templates padrão por organização
- Configurar retry automático (ligar/desligar)
- Configurar timeout de PDF
- Webhook URL para teste

**Agente:** @dev

### 4.3 Arquivos da Interface

| Arquivo | Agente | Descrição |
|---------|--------|-----------|
| `app/(dashboard)/dashboard/whatsapp/form-submissions/page.tsx` | @dev | Dashboard principal |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/pending/page.tsx` | @dev | Lista de pendentes |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/history/page.tsx` | @dev | Histórico |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/settings/page.tsx` | @dev | Configurações |
| `components/form-submissions/stats-cards.tsx` | @dev | Cards de estatísticas |
| `components/form-submissions/pending-table.tsx` | @dev | Tabela de pendentes |
| `components/form-submissions/history-table.tsx` | @dev | Tabela de histórico |
| `components/form-submissions/status-badge.tsx` | @dev | Badge de status colorido |
| `components/form-submissions/lead-details-dialog.tsx` | @dev | Modal com detalhes do lead |
| `hooks/use-form-submissions.ts` | @dev | Hook para buscar dados |
| `lib/api/form-submissions.ts` | @dev | Funções de API |

### 4.4 Endpoints da API para Interface

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/form-submissions/stats` | GET | Estatísticas para dashboard |
| `/api/form-submissions/pending` | GET | Lista de pendentes |
| `/api/form-submissions/history` | GET | Histórico com filtros |
| `/api/form-submissions/[id]/reprocess` | POST | Reprocessar manualmente |
| `/api/form-submissions/[id]/cancel` | POST | Cancelar envio |
| `/api/form-submissions/settings` | GET/PUT | Configurações |

---

## 5. Schema do Banco (Prisma)

### 5.1 Model a Adicionar (@architect)

```prisma
// prisma/schema.prisma

model PendingFormDelivery {
  id              String    @id @default(cuid())
  messageId       String    @unique  // ID retornado pela Meta ao enviar template
  
  // Identificação
  organizationId  String
  instanceId      String
  phone           String
  
  // Documento
  pdfUrl          String    // URL do PDF no sistema externo
  pdfFilename     String
  mediaId         String?   // ID do documento na Meta (após upload)
  
  // Template
  templateName    String
  templateLanguage String   @default("pt_BR")
  
  // Lead (denormalizado para rastreamento)
  leadName        String?
  leadEmail       String?
  
  // Rastreamento externo
  dossieId        String?   // ID do dossié no plano-de-acao
  alunoId         String?   // ID do aluno no plano-de-acao
  
  // Status
  status          PendingFormDeliveryStatus @default(WAITING)
  retryCount      Int       @default(0)
  
  // Controle de reprocessamento
  isCancelled     Boolean   @default(false)
  cancelledAt     DateTime?
  cancelledBy     String?
  reprocessedFrom String?   // ID original se for reprocessamento
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  expiresAt       DateTime  // TTL (24h após createdAt)
  completedAt     DateTime?
  
  // Error tracking
  errorMessage    String?
  lastErrorAt     DateTime?
  
  // Relações
  organization    Organization     @relation(fields: [organizationId], references: [id])
  instance        WhatsAppInstance @relation(fields: [instanceId], references: [id])
  
  @@index([messageId])
  @@index([organizationId])
  @@index([status])
  @@index([expiresAt])
  @@index([dossieId])
  @@index([createdAt])
  @@map("pending_form_deliveries")
}

enum PendingFormDeliveryStatus {
  WAITING      // Aguardando confirmação de entrega do template
  PROCESSING   // Enviando PDF (upload + send)
  COMPLETED    // PDF entregue com sucesso
  FAILED       // Erro após tentativas
  EXPIRED      // PDF URL expirou (24h)
  CANCELLED    // Cancelado manualmente
}
```

### 5.2 Relações a Adicionar

```prisma
// Adicionar a Organization
model Organization {
  // ... campos existentes
  pendingFormDeliveries PendingFormDelivery[]
}

// Adicionar a WhatsAppInstance
model WhatsAppInstance {
  // ... campos existentes
  pendingFormDeliveries PendingFormDelivery[]
}
```

---

## 6. Arquivos

### 6.1 Novos Arquivos (Backend)

| Arquivo | Agente | Descrição | Complexidade |
|---------|--------|-----------|--------------|
| `prisma/migrations/xxxx_add_pending_form_delivery/migration.sql` | @architect | Migration do banco | Baixa |
| `app/api/webhooks/form-submission/route.ts` | @dev | Endpoint POST para receber webhooks | Média |
| `app/api/form-submissions/stats/route.ts` | @dev | Estatísticas para dashboard | Baixa |
| `app/api/form-submissions/pending/route.ts` | @dev | Lista de pendentes | Baixa |
| `app/api/form-submissions/history/route.ts` | @dev | Histórico com filtros | Média |
| `app/api/form-submissions/[id]/reprocess/route.ts` | @dev | Reprocessar manualmente | Média |
| `app/api/form-submissions/[id]/cancel/route.ts` | @dev | Cancelar envio | Baixa |
| `app/api/form-submissions/settings/route.ts` | @dev | Configurações | Baixa |
| `lib/whatsapp/form-webhook-processor.ts` | @dev | Processamento do webhook | Alta |
| `lib/whatsapp/form-delivery-processor.ts` | @dev | Processamento da entrega | Alta |
| `lib/whatsapp/media-upload.ts` | @dev | Upload resumable para Meta API | Alta |
| `lib/whatsapp/form-webhook-validator.ts` | @dev | Validação de schema (Zod) | Baixa |
| `types/form-webhook.ts` | @architect | Tipagens TypeScript | Baixa |

### 6.2 Novos Arquivos (Frontend)

| Arquivo | Agente | Descrição | Complexidade |
|---------|--------|-----------|--------------|
| `app/(dashboard)/dashboard/whatsapp/form-submissions/page.tsx` | @dev | Dashboard | Média |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/pending/page.tsx` | @dev | Pendentes | Média |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/history/page.tsx` | @dev | Histórico | Média |
| `app/(dashboard)/dashboard/whatsapp/form-submissions/settings/page.tsx` | @dev | Configurações | Baixa |
| `components/form-submissions/stats-cards.tsx` | @dev | Cards de stats | Baixa |
| `components/form-submissions/pending-table.tsx` | @dev | Tabela pendentes | Média |
| `components/form-submissions/history-table.tsx` | @dev | Tabela histórico | Média |
| `components/form-submissions/status-badge.tsx` | @dev | Badge de status | Baixa |
| `components/form-submissions/lead-details-dialog.tsx` | @dev | Modal detalhes | Baixa |
| `hooks/use-form-submissions.ts` | @dev | Hook de dados | Baixa |
| `lib/api/form-submissions.ts` | @dev | Funções API | Baixa |

### 6.3 Arquivos Modificados

| Arquivo | Agente | O que muda | Impacto |
|---------|--------|------------|---------|
| `prisma/schema.prisma` | @architect | Adicionar PendingFormDelivery + relações | Alto |
| `app/api/whatsapp/webhooks/route.ts` | @dev | Adicionar handler para enviar PDF após delivered | Alto |
| `lib/whatsapp/cloud-api.ts` | @dev | Adicionar funções de upload de mídia | Médio |
| `components/sidebar/whatsapp-sidebar.tsx` | @dev | Adicionar link para "Envio de Formulários" | Baixo |
| `lib/whatsapp/webhook-handler.ts` | @dev | Adicionar tipos para processamento de pendências | Baixo |
| `lib/db/whatsapp.ts` | @dev | Exportar tipos atualizados | Baixo |

---

## 7. Tasks de Implementação

### 🔷 Fase 1 - Schema e Banco (@architect)

#### 7.1.1 Schema e Migration
- [ ] **TASK-001**: Revisar e aprovar schema PendingFormDelivery (@architect)
- [ ] **TASK-002**: Criar tipagens TypeScript em `types/form-webhook.ts` (@architect)
- [ ] **TASK-003**: Gerar migration do Prisma: `npx prisma migrate dev --name add_pending_form_delivery` (@dev)
- [ ] **TASK-004**: Aplicar migration em produção: `npx prisma migrate deploy` (@devops)

### 🔷 Fase 2 - Backend Core (@dev)

#### 7.2.1 Validação e Tipagens
- [ ] **TASK-005**: Criar schema Zod para validação do payload em `lib/whatsapp/form-webhook-validator.ts`
- [ ] **TASK-006**: Criar tipagens TypeScript em `types/form-webhook.ts`

#### 7.2.2 Media Upload
- [ ] **TASK-007**: Implementar upload resumable na Meta API em `lib/whatsapp/media-upload.ts`
- [ ] **TASK-008**: Implementar download de PDF de URL externa com timeout

#### 7.2.3 Processadores
- [ ] **TASK-009**: Implementar `lib/whatsapp/form-webhook-processor.ts`
- [ ] **TASK-010**: Implementar `lib/whatsapp/form-delivery-processor.ts`

#### 7.2.4 Endpoints Webhook
- [ ] **TASK-011**: Criar `app/api/webhooks/form-submission/route.ts` (POST)
- [ ] **TASK-012**: Modificar `app/api/whatsapp/webhooks/route.ts` para chamar delivery processor no delivered

#### 7.2.5 Endpoints da Interface
- [ ] **TASK-013**: Criar `app/api/form-submissions/stats/route.ts`
- [ ] **TASK-014**: Criar `app/api/form-submissions/pending/route.ts`
- [ ] **TASK-015**: Criar `app/api/form-submissions/history/route.ts`
- [ ] **TASK-016**: Criar `app/api/form-submissions/[id]/reprocess/route.ts`
- [ ] **TASK-017**: Criar `app/api/form-submissions/[id]/cancel/route.ts`
- [ ] **TASK-018**: Criar `app/api/form-submissions/settings/route.ts`

### 🔷 Fase 3 - Interface Frontend (@dev)

#### 7.3.1 Sidebar e Navegação
- [ ] **TASK-019**: Adicionar link "Envio de Formulários" na sidebar da API Oficial Meta
- [ ] **TASK-020**: Configurar rotas aninhadas no Next.js

#### 7.3.2 Componentes
- [ ] **TASK-021**: Criar `components/form-submissions/status-badge.tsx`
- [ ] **TASK-022**: Criar `components/form-submissions/stats-cards.tsx`
- [ ] **TASK-023**: Criar `components/form-submissions/pending-table.tsx`
- [ ] **TASK-024**: Criar `components/form-submissions/history-table.tsx`
- [ ] **TASK-025**: Criar `components/form-submissions/lead-details-dialog.tsx`

#### 7.3.3 Hooks e API
- [ ] **TASK-026**: Criar `hooks/use-form-submissions.ts`
- [ ] **TASK-027**: Criar `lib/api/form-submissions.ts`

#### 7.3.4 Páginas
- [ ] **TASK-028**: Criar `app/(dashboard)/dashboard/whatsapp/form-submissions/page.tsx` (Dashboard)
- [ ] **TASK-029**: Criar `app/(dashboard)/dashboard/whatsapp/form-submissions/pending/page.tsx`
- [ ] **TASK-030**: Criar `app/(dashboard)/dashboard/whatsapp/form-submissions/history/page.tsx`
- [ ] **TASK-031**: Criar `app/(dashboard)/dashboard/whatsapp/form-submissions/settings/page.tsx`

### 🔷 Fase 4 - Testes e Validação (@qa)

#### 7.4.1 Testes Unitários
- [ ] **TASK-032**: Testar validação de payload com Zod
- [ ] **TASK-033**: Testar upload de mídia (mockar Meta API)
- [ ] **TASK-034**: Testar processamento de webhook

#### 7.4.2 Testes de Integração
- [ ] **TASK-035**: Testar fluxo completo com Meta API em sandbox
- [ ] **TASK-036**: Testar retry logic em caso de falha
- [ ] **TASK-037**: Testar idempotência (dois delivered para mesmo messageId)

#### 7.4.3 Testes End-to-End
- [ ] **TASK-038**: Testar integração com plano-de-acao-lancamento real
- [ ] **TASK-039**: Validar que PDF chega no WhatsApp do lead
- [ ] **TASK-040**: Testar interface de gerenciamento (dashboard, pendentes, histórico)

#### 7.4.4 Testes de Segurança
- [ ] **TASK-041**: Testar autenticação do webhook (secret inválido)
- [ ] **TASK-042**: Testar rate limiting
- [ ] **TASK-043**: Verificar que não há vazamento de dados em logs

---

## 8. Payload Esperado

### 8.1 Recebido do Plano de Ação

```json
{
  "secret": "whsec_xxxxxxxxxxxxxxxx",
  "organizationId": "org_abc123",
  "instanceId": "inst_xyz789",
  "templateName": "plano_acao_envio",
  "templateLanguage": "pt_BR",
  "templateVariables": ["João Silva"],
  "leadData": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "5511999999999"
  },
  "pdfUrl": "https://plano-de-acao.com/temp-pdfs/dossie_abc123.pdf",
  "pdfFilename": "plano-de-acao-joao-silva-v1.pdf",
  "dossieId": "dossie_abc123",
  "alunoId": "aluno_xyz789",
  "source": "typebot",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8.2 Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "contactId": "contact_123",
    "conversationId": "conv_456",
    "templateMessageId": "wamid.xxx",
    "pendingDeliveryId": "pfd_789",
    "status": "WAITING"
  }
}
```

### 8.3 Resposta de Erro

```json
{
  "success": false,
  "error": "Template not found or not approved",
  "errorCode": "TEMPLATE_NOT_FOUND"
}
```

---

## 9. Variáveis de Ambiente

### 9.1 Novas Variáveis (.env.local)

```bash
# ============================================
# WEBHOOK DE FORMULÁRIO
# ============================================

# Secret compartilhado com o plano-de-acao-lancamento
FORM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Timeout para download de PDF (ms)
FORM_PDF_DOWNLOAD_TIMEOUT_MS=30000

# Tamanho máximo de PDF (MB)
FORM_MAX_PDF_SIZE_MB=10

# ============================================
# RETRY E EXPIRAÇÃO
# ============================================

# Número máximo de tentativas
FORM_DELIVERY_MAX_RETRIES=3

# Tempo entre retries (ms) - backoff exponencial
FORM_DELIVERY_RETRY_BASE_MS=1000

# Tempo de expiração do registro (horas)
FORM_DELIVERY_EXPIRY_HOURS=24

# ============================================
# RATE LIMITING
# ============================================

# Máximo de webhooks por minuto
FORM_WEBHOOK_RATE_LIMIT_PER_MIN=10
```

---

## 10. Critérios de Aceite

### 10.1 Funcionais

| ID | Critério | Como Validar |
|----|----------|--------------|
| **CA-001** | Endpoint recebe POST e retorna 200 | Curl com payload válido |
| **CA-002** | Template é enviado corretamente | Verificar messageId no banco |
| **CA-003** | PendingFormDelivery é criado com status WAITING | Query no banco |
| **CA-004** | Ao receber delivered, PDF é baixado e enviado | Verificar no WhatsApp do lead |
| **CA-005** | Status atualiza para COMPLETED ao final | Query no banco |
| **CA-006** | Dashboard exibe estatísticas corretas | Verificar interface |
| **CA-007** | Tabela de pendentes mostra dados em tempo real | Verificar auto-refresh |
| **CA-008** | Reprocessamento manual funciona | Clicar no botão e verificar |
| **CA-009** | Cancelamento funciona | Clicar no botão e verificar status CANCELLED |
| **CA-010** | Histórico exibe registros com filtros | Testar filtros na interface |
| **CA-011** | Segundo delivered não reenvia PDF (idempotência) | Testar duplicado |
| **CA-012** | Payload inválido retorna 400 | Curl com dados faltando |
| **CA-013** | Secret errado retorna 401 | Curl com token errado |
| **CA-014** | Template não aprovado retorna erro claro | Testar template rejeitado |

### 10.2 Não-Funcionais

| ID | Critério | Métrica |
|----|----------|---------|
| **CA-015** | Tempo de resposta do webhook | < 3 segundos |
| **CA-016** | Tempo total para envio do PDF | < 30 segundos após delivered |
| **CA-017** | Tempo de carregamento do dashboard | < 2 segundos |
| **CA-018** | Disponibilidade | 99.9% |
| **CA-019** | Taxa de sucesso no envio | > 95% |

---

## 11. Códigos de Erro da Meta

| Código | Descrição | Tratamento |
|--------|-----------|------------|
| `131026` | Janela de 24h não aberta | Salvar como FAILED, não reverter para WAITING |
| `131047` | Template não aprovado | Retornar erro 400 imediatamente |
| `131051` | Tipo de mídia inválido | Verificar Content-Type do PDF antes do upload |
| `132000` | Número de telefone inválido | Retornar erro 400 |
| `100` | Parâmetro inválido | Log detalhado + status FAILED |
| `1` | Rate limit | Retry com delay maior |

---

## 12. Referências

- [Meta — Send Document Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/document-messages)
- [Meta — Resumable Upload API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Meta — Template Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/template-messages)
- [Meta — Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)

---

**Plano criado por**: @pm  
**Revisão técnica**: @architect  
**Data**: 2024-01-15  
**Versão**: 2.0 (atualizado - sem cleanup, com interface)
