# PLANO DE IMPLEMENTAÇÃO - CRM NexIA
## Feature: Integração com Plano de Ação (Typebot/Formulários)

**Versão:** 1.0  
**Data:** 2026-03-10  
**Status:** Draft  
**Prioridade:** Alta

---

## 📋 Visão Geral

Este plano documenta a implementação da integração entre o CRM NexIA e o sistema externo "plano-de-acao-lancamento" para recebimento de webhooks de submissão de formulários e envio automático de PDFs via WhatsApp.

### Fluxo Macro

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ plano-de-acao-      │────▶│  CRM NexIA          │────▶│  Meta Cloud API     │
│ lancamento          │     │  (Este Sistema)     │     │  (WhatsApp)         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                           │
         │  1. POST /webhooks/       │                           │
         │     form-submission       │                           │
         │──────────────────────────▶│                           │
         │                           │  2. Valida + Cria Lead    │
         │                           │  3. Envia Template        │
         │                           │──────────────────────────▶│
         │                           │                           │
         │                           │◀──────────────────────────│
         │                           │  4. Webhook delivered     │
         │                           │     (async)               │
         │                           │                           │
         │                           │  5. Baixa PDF             │
         │                           │  6. Upload para Meta      │
         │                           │  7. Envia Documento       │
         │                           │──────────────────────────▶│
         │                           │                           │
```

### Benefícios
- **Automação de Entrega:** Envio automático de dossiês/planos de ação após preenchimento de formulários
- **Rastreabilidade:** Controle completo do status de entrega via tabela `PendingFormDelivery`
- **Escalabilidade:** Processamento assíncrono de webhooks sem bloquear respostas
- **Confiabilidade:** Tratamento de falhas com retry e expiração automática

---

## 👥 Agentes AIOS Responsáveis

| Agente | Papel | Responsabilidades |
|--------|-------|-------------------|
| **@pm** | Product Manager | Definição de requisitos, aprovação do plano, coordenação entre agentes |
| **@architect** | Arquiteto de Software | Design de schema, decisões técnicas estratégicas, revisão de arquitetura |
| **@dev** | Desenvolvedor | Implementação de código, testes unitários, integração entre componentes |
| **@qa** | Quality Assurance | Testes de integração, validação de fluxo end-to-end, testes de carga |

---

## 🏗️ Arquitetura e Decisões Técnicas

### 1. Arquitetura de Estados (State Machine)

```
┌─────────┐    submit     ┌──────────┐    delivered webhook    ┌─────────────┐
│  START  │──────────────▶│ WAITING  │────────────────────────▶│ PROCESSING  │
└─────────┘               └──────────┘                         └──────┬──────┘
     │                     │    │                                    │
     │                     │    └──────▶ timeout (24h) ──────────────▶│
     │                     │              ┌────────┐                  │
     │                     └─────────────▶│ EXPIRED│◀─────────────────┘
     │                                    └────────┘   upload fail   │
     │                                                               │
     │                          ┌─────────┐    success               │
     └─────────────────────────▶│ COMPLETED│◀────────────────────────┘
                                └─────────┘
                                     ▲
                                     │
                                ┌────┴────┐
                                │  FAILED │◀─── unrecoverable error
                                └─────────┘
```

### 2. Decisões Técnicas (ADR)

#### ADR-001: Tabela de Pendências vs Fila de Mensagens
**Decisão:** Usar tabela `PendingFormDelivery` ao invés de Redis/RabbitMQ  
**Motivação:** 
- Consistência com stack existente (PostgreSQL + Prisma)
- Visibilidade fácil para debugging via painel admin
- Não adiciona infraestrutura nova
- Atomicidade com transações do Prisma

#### ADR-002: Download Síncrono vs Assíncrono
**Decisão:** Download síncrono no momento do processamento  
**Motivação:**
- PDF pode expirar (URLs temporárias do sistema externo)
- Meta API aceita stream direto, evita armazenamento local
- Retry pode ser feito re-consultando URL do sistema externo se necessário

#### ADR-003: Resumable Upload da Meta
**Decisão:** Usar upload em uma única requisição (non-resumable)  
**Motivação:**
- PDFs esperados: < 5MB (dossiês de lançamento)
- Limite Meta: 100MB para upload direto
- Simplicidade de implementação
- *Nota:* Se necessário no futuro, migrar para resumable upload

#### ADR-004: Validação de Secret
**Decisão:** Header `X-Form-Webhook-Secret` com HMAC opcional  
**Motivação:**
- Sistema externo não suporta assinatura nativa como Meta
- Header simples para MVP, evoluir para HMAC se necessário

---

## 📁 Arquivos

### Novos

| Arquivo | Agente | Descrição | Complexidade |
|---------|--------|-----------|--------------|
| `prisma/migrations/YYYYMMDDHHMMSS_add_pending_form_delivery/migration.sql` | @architect | Migration SQL para nova tabela e enum | Média |
| `app/api/webhooks/form-submission/route.ts` | @dev | Endpoint POST para receber webhooks do sistema externo | Alta |
| `lib/whatsapp/form-webhook-processor.ts` | @dev | Lógica de negócio: validação, criação de lead, envio de template | Alta |
| `lib/whatsapp/form-delivery-processor.ts` | @dev | Processamento do delivered: download PDF, upload Meta, envio documento | Alta |
| `lib/whatsapp/media-upload.ts` | @dev | Helper para upload de mídia na Meta Cloud API | Média |
| `lib/whatsapp/form-webhook-validator.ts` | @dev | Validação de headers e payload dos webhooks | Média |
| `app/api/admin/pending-deliveries/route.ts` | @dev | Endpoint admin para listar e monitorar entregas pendentes | Baixa |
| `types/form-webhook.ts` | @dev | Tipagens TypeScript para payloads e respostas | Baixa |
| `scripts/cleanup-expired-deliveries.ts` | @dev | Script cron para expirar entregas antigas | Média |

### Modificados

| Arquivo | Agente | O que muda | Risco |
|---------|--------|------------|-------|
| `prisma/schema.prisma` | @architect | Adicionar model `PendingFormDelivery` e enum `PendingFormDeliveryStatus` | Baixo |
| `app/api/whatsapp/webhooks/route.ts` | @dev | Adicionar handler para verificar pendências ao receber status `delivered` | Médio |
| `lib/whatsapp/cloud-api.ts` | @dev | Adicionar função `uploadMedia()` para upload de documentos | Baixo |
| `lib/whatsapp/webhook-handler.ts` | @dev | Adicionar export `isDelivered()` helper | Baixo |
| `lib/db/whatsapp.ts` | @dev | Verificar/adicionar tipos Prisma para nova tabela | Baixo |

---

## ✅ Tasks de Implementação

### 🔵 Fase 1 - Schema e Banco de Dados

#### Task 1.1: Atualizar Schema Prisma (@architect)
- [ ] Adicionar enum `PendingFormDeliveryStatus` com valores: `WAITING`, `PROCESSING`, `COMPLETED`, `FAILED`, `EXPIRED`
- [ ] Adicionar model `PendingFormDelivery` com todos os campos especificados
- [ ] Adicionar índices: `messageId` (unique), `status`, `organizationId`, `createdAt`
- [ ] Relacionar com `Organization` (opcional mas recomendado)
- [ ] Rodar `prisma migrate dev` para gerar migration
- [ ] Verificar geração de tipos com `prisma generate`

**Critério de Aceite:**
```bash
npx prisma migrate status # deve mostrar migration pendente aplicada
npx prisma studio # deve mostrar tabela pending_form_deliveries
```

#### Task 1.2: Criar Tipagens TypeScript (@dev)
- [ ] Criar arquivo `types/form-webhook.ts`
- [ ] Definir interface `FormSubmissionPayload`
- [ ] Definir interface `FormDeliveryConfig`
- [ ] Definir tipos de resposta da API

---

### 🟢 Fase 2 - Implementação Core

#### Task 2.1: Helper de Upload de Mídia (@dev)
- [ ] Criar `lib/whatsapp/media-upload.ts`
- [ ] Implementar `uploadMediaToMeta()`:
  - Recebe: `Buffer/Stream`, `mimeType`, `phoneNumberId`, `accessToken`
  - Retorna: `mediaId` (string)
  - Lidar com erros da API (rate limit, invalid media, etc)
- [ ] Implementar `downloadFileFromUrl()`:
  - Recebe: URL temporária
  - Retorna: `Buffer`
  - Timeout configurável (padrão: 30s)
  - Validação de tamanho máximo (10MB)

**Payload de Request (Meta Upload):**
```http
POST /v18.0/{phone-number-id}/media
Content-Type: multipart/form-data
Authorization: Bearer {access-token}

file: <binary-data>
messaging_product: whatsapp
type: application/pdf
```

**Response de Sucesso:**
```json
{
  "id": "<MEDIA_ID>"
}
```

#### Task 2.2: Validador de Webhooks (@dev)
- [ ] Criar `lib/whatsapp/form-webhook-validator.ts`
- [ ] Implementar `validateFormWebhookSecret()`:
  - Verifica header `X-Form-Webhook-Secret`
  - Compara com `env.FORM_WEBHOOK_SECRET`
  - Retorna boolean + motivo do erro
- [ ] Implementar `validateFormPayload()`:
  - Valida schema com Zod
  - Verifica campos obrigatórios
  - Valida formato de telefone (E.164)
  - Valida URL do PDF

#### Task 2.3: Processador de Formulários (@dev)
- [ ] Criar `lib/whatsapp/form-webhook-processor.ts`
- [ ] Implementar `processFormSubmission()`:
  - Fluxo completo Fase 1-3 (ver diagrama abaixo)
  - Transação atômica Prisma
  - Tratamento de erros por etapa

**Fluxo Detalhado:**
```typescript
async function processFormSubmission(payload: FormSubmissionPayload) {
  // 1. Validar payload
  // 2. Buscar WhatsAppInstance
  // 3. Criar/atualizar Contact
  // 4. Criar Conversation (BUSINESS_INITIATED)
  // 5. Enviar Template Message via Meta API
  // 6. Criar Message record
  // 7. Criar PendingFormDelivery (status: WAITING)
  // 8. Retornar sucesso
}
```

#### Task 2.4: Endpoint de Recebimento (@dev)
- [ ] Criar `app/api/webhooks/form-submission/route.ts`
- [ ] Implementar handler POST:
  - Rate limiting (10 req/min por IP)
  - Validação de secret
  - Validação de payload
  - Chama `processFormSubmission()`
  - Retorna resposta padronizada

**Respostas HTTP:**
```typescript
// 200 OK - Processado com sucesso
{ success: true, data: { messageId: "...", deliveryId: "..." } }

// 400 Bad Request - Payload inválido
{ success: false, error: "Invalid payload", details: [...] }

// 401 Unauthorized - Secret inválido
{ success: false, error: "Invalid webhook secret" }

// 404 Not Found - Organization ou Instance não existe
{ success: false, error: "Organization not found" }

// 422 Unprocessable - Template não encontrado ou não aprovado
{ success: false, error: "Template not found or not approved" }

// 429 Too Many Requests - Rate limit excedido
{ success: false, error: "Rate limit exceeded", retryAfter: 60 }

// 500/502/503 - Erro interno (não expor detalhes)
{ success: false, error: "Internal server error" }
```

#### Task 2.5: Processador de Entrega (@dev)
- [ ] Criar `lib/whatsapp/form-delivery-processor.ts`
- [ ] Implementar `processPendingDelivery()`:
  - Busca PendingFormDelivery por messageId
  - Download do PDF
  - Upload para Meta
  - Envio de document message
  - Atualização de status

**Fluxo Detalhado:**
```typescript
async function processPendingDelivery(messageId: string) {
  // 1. Buscar PendingFormDelivery (status: WAITING)
  // 2. Atualizar status para PROCESSING
  // 3. Baixar PDF da URL
  // 4. Fazer upload para Meta API
  // 5. Enviar document message com mediaId
  // 6. Criar Message record do documento
  // 7. Atualizar PendingFormDelivery para COMPLETED
  // 8. Retornar sucesso
}
```

**Tratamento de Erros:**
- PDF não baixou (timeout/404): Marcar FAILED, logar erro
- Upload falhou (rate limit): Retry automático (exponential backoff)
- Envio falhou: Marcar FAILED, tentar reprocessar manualmente

#### Task 2.6: Integração com Webhook Handler Existente (@dev)
- [ ] Modificar `app/api/whatsapp/webhooks/route.ts`
- [ ] No handler `onStatus`, quando status === 'delivered':
  - Chamar `checkAndProcessPendingDelivery(status.id)`
  - Não bloquear resposta (fire-and-forget)
  - Log de sucesso/erro

**Implementação:**
```typescript
// Dentro do handler onStatus
if (mappedStatus === 'DELIVERED') {
  // Processa entrega pendente em background
  checkAndProcessPendingDelivery(status.id)
    .catch(err => console.error('[PendingDelivery] Error:', err));
}
```

---

### 🟡 Fase 3 - Testes e Validação

#### Task 3.1: Testes Unitários (@dev)
- [ ] Testes para `media-upload.ts` (mock do fetch)
- [ ] Testes para `form-webhook-validator.ts` (casos válidos/inválidos)
- [ ] Testes para `form-webhook-processor.ts` (fluxo completo mockado)
- [ ] Testes para `form-delivery-processor.ts` (erros e sucesso)

#### Task 3.2: Testes de Integração (@qa)
- [ ] Setup de ambiente de teste
- [ ] Teste E2E: Envio de webhook → Recebimento de template → Confirmação de delivered → Recebimento de PDF
- [ ] Teste de carga: 100 webhooks simultâneos
- [ ] Teste de timeout: URL de PDF inacessível
- [ ] Teste de erro: Secret inválido

#### Task 3.3: Documentação e Monitoramento (@dev)
- [ ] Criar endpoint admin: `GET /api/admin/pending-deliveries`
- [ ] Query params: `status`, `organizationId`, `from`, `to`, `limit`
- [ ] Script de cleanup: `scripts/cleanup-expired-deliveries.ts`
- [ ] Documentar métricas/logs a serem monitorados

---

## 📦 Payload Esperado

### Request: POST /api/webhooks/form-submission

```typescript
interface FormSubmissionPayload {
  // Identificação
  organizationId: string;        // UUID da organização no CRM
  instanceId: string;            // UUID da WhatsAppInstance
  
  // Dados do Lead
  leadData: {
    name: string;                // Nome completo do lead
    phone: string;               // Telefone em formato E.164 (ex: "5511999999999")
    email?: string;              // Email do lead (opcional)
    metadata?: Record<string, unknown>; // Dados adicionais do formulário
  };
  
  // Configuração do Envio
  templateName: string;          // Nome do template aprovado na Meta
  templateLanguage?: string;     // Código do idioma (default: "pt_BR")
  templateVariables?: Array<{
    type: 'text' | 'currency' | 'date_time';
    value: string;
  }>;
  
  // Documento
  pdfUrl: string;                // URL temporária do PDF (válida por 24h)
  pdfFilename?: string;          // Nome sugerido do arquivo (default: "documento.pdf")
  
  // Referências Externas
  dossieId?: string;             // ID do dossié no sistema externo
  formId?: string;               // ID do formulário/typebot
  submissionId?: string;         // ID único da submissão (para idempotência)
  
  // Opcional
  customMessage?: string;        // Mensagem adicional (não usada se template definido)
}
```

### Exemplo de Payload

```json
{
  "organizationId": "org_123456789",
  "instanceId": "wa_instance_abc123",
  "leadData": {
    "name": "João Silva",
    "phone": "5511999999999",
    "email": "joao.silva@email.com",
    "metadata": {
      "produto_interesse": "Curso de Marketing",
      "origem": "Landing Page"
    }
  },
  "templateName": "boas_vindas_dossie",
  "templateLanguage": "pt_BR",
  "templateVariables": [
    { "type": "text", "value": "João Silva" },
    { "type": "text", "value": "Curso de Marketing" }
  ],
  "pdfUrl": "https://plano-de-acao.example.com/dossies/dossie_123.pdf?token=xyz789",
  "pdfFilename": "Plano_de_Acao_Joao_Silva.pdf",
  "dossieId": "dossie_123",
  "formId": "form_lancamento_v1",
  "submissionId": "sub_987654321"
}
```

### Headers

```http
POST /api/webhooks/form-submission
Content-Type: application/json
X-Form-Webhook-Secret: {FORM_WEBHOOK_SECRET}
X-Form-Source: plano-de-acao-lancamento
Idempotency-Key: {submissionId}  // Opcional, para retry seguro
```

### Response de Sucesso

```json
{
  "success": true,
  "data": {
    "messageId": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABEYEjdCRkY2MDYzRTA3...",
    "deliveryId": "del_abc123xyz",
    "contactId": "contact_def456uvw",
    "conversationId": "conv_ghi789rst",
    "status": "WAITING",
    "estimatedProcessingTime": "30-60s"
  }
}
```

---

## 🔐 Variáveis de Ambiente

```bash
# ============================================
# INTEGRAÇÃO FORMS - NOVAS VARIÁVEIS
# ============================================

# Segurança
FORM_WEBHOOK_SECRET=whsec_form_webhook_secret_minimo_32_chars

# Configurações de Processamento
FORM_DELIVERY_TIMEOUT_MS=30000          # Timeout para download do PDF (default: 30s)
FORM_DELIVERY_MAX_RETRIES=3             # Máximo de tentativas de reprocessamento
FORM_DELIVERY_RETRY_DELAY_MS=5000       # Delay entre retries (exponential backoff)
FORM_DELIVERY_EXPIRY_HOURS=24           # Expiração automática de pendências

# Limites
FORM_WEBHOOK_RATE_LIMIT_PER_MIN=10      # Rate limit por IP/minuto
FORM_MAX_PDF_SIZE_MB=10                 # Tamanho máximo do PDF

# Debug/Development
FORM_WEBHOOK_DEBUG=false                # Log detalhado de payloads
FORM_DELIVERY_SIMULATE_DELIVERY=false   # Simular delivered imediatamente (dev only)
```

### .env.local.example (adicione ao final)

```bash
# ============================================
# INTEGRAÇÃO COM PLANO DE AÇÃO
# ============================================
FORM_WEBHOOK_SECRET=whsec_change_this_in_production_min_32_chars
FORM_DELIVERY_TIMEOUT_MS=30000
FORM_DELIVERY_MAX_RETRIES=3
FORM_DELIVERY_EXPIRY_HOURS=24
FORM_WEBHOOK_RATE_LIMIT_PER_MIN=10
FORM_MAX_PDF_SIZE_MB=10
```

---

## ✅ Critérios de Aceite

### Funcionais

| ID | Critério | Prioridade |
|----|----------|------------|
| CA-001 | Receber webhook de formulário com validação de secret | P0 |
| CA-002 | Criar/atualizar Contact com dados do lead | P0 |
| CA-003 | Enviar template message via Meta API | P0 |
| CA-004 | Criar registro em PendingFormDelivery com status WAITING | P0 |
| CA-005 | Processar entrega ao receber webhook delivered da Meta | P0 |
| CA-006 | Baixar PDF da URL temporária | P0 |
| CA-007 | Fazer upload do PDF para Meta API | P0 |
| CA-008 | Enviar document message com o PDF | P0 |
| CA-009 | Atualizar status para COMPLETED após envio | P0 |
| CA-010 | Tratar erros e atualizar status para FAILED | P0 |
| CA-011 | Expirar pendências após 24h sem delivered | P1 |
| CA-012 | Endpoint admin para listar entregas pendentes | P1 |
| CA-013 | Rate limiting no endpoint de webhooks | P1 |
| CA-014 | Idempotência por submissionId | P2 |

### Não-Funcionais

| ID | Critério | Métrica |
|----|----------|---------|
| NF-001 | Tempo de resposta do webhook | < 2s (p95) |
| NF-002 | Tempo total de entrega (template → PDF) | < 60s (p95) |
| NF-003 | Disponibilidade do endpoint | 99.9% |
| NF-004 | Taxa de erro aceitável | < 1% |
| NF-005 | Suporte a 100 req/s simultâneas | Sim |

---

## 🚨 Códigos de Erro da Meta

### Upload de Mídia

| Código | Descrição | Tratamento |
|--------|-----------|------------|
| `100` | Invalid parameter | Verificar mimeType e tamanho do arquivo. Logar erro, marcar FAILED. |
| `200` | Permission error | Access token inválido ou sem permissão. Notificar admin, marcar FAILED. |
| `80000` | Rate limit hit | Retry com exponential backoff (1s, 2s, 4s). Máx 3 tentativas. |
| `80007` | Media upload error | Arquivo corrompido ou formato inválido. Baixar novamente, se persistir FAILED. |
| `80014` | Media type not supported | Verificar se é application/pdf. Se não for, converter ou marcar FAILED. |

### Envio de Mensagem

| Código | Descrição | Tratamento |
|--------|-----------|------------|
| `130429` | Rate limit hit | Retry com backoff. Notificar se persistir. |
| `132000` | Number of parameters mismatch | Template com variáveis incorretas. Logar erro, marcar FAILED. |
| `132001` | Template does not exist | Template não aprovado ou não encontrado. Retornar 422 no webhook. |
| `132005` | Template text too long | Texto das variáveis muito longo. Truncar ou marcar FAILED. |
| `133000` | Invalid phone number | Formato de telefone inválido. Retornar 400 no webhook inicial. |
| `133004` | Phone number not in allowed list | Número não é WhatsApp válido. Marcar FAILED, notificar sistema externo. |
| `131021` | Recipient cannot be sender | Tentativa de enviar para próprio número. Marcar FAILED. |
| `131047` | Re-engagement message | Fora da janela de 24h e sem template aprovado. Usar template obrigatório. |
| `131026` | Message undeliverable | Número inválido ou não existe. Marcar FAILED. |

### Erros Internos (Nossos)

| Código | Descrição | Tratamento |
|--------|-----------|------------|
| `NEXIA_001` | PDF download timeout | Retry uma vez, se falhar marcar FAILED. |
| `NEXIA_002` | PDF too large | Marcar FAILED, notificar que PDF excede limite. |
| `NEXIA_003` | Instance not found | Retornar 404 no webhook inicial. |
| `NEXIA_004` | Organization not found | Retornar 404 no webhook inicial. |
| `NEXIA_005` | Template not approved | Retornar 422 no webhook inicial. |
| `NEXIA_006` | Delivery already processed | Ignorar (idempotência). |
| `NEXIA_007` | Delivery expired | Marcar EXPIRED, não processar. |

---

## 📊 Monitoramento e Logs

### Métricas a Monitorar

```typescript
// Métricas para dashboard (ex: Datadog, Grafana)
interface FormDeliveryMetrics {
  // Volume
  webhooks_received_total: Counter;
  webhooks_received_by_status: Counter; // status: WAITING, FAILED, etc
  
  // Performance
  webhook_processing_duration: Histogram; // em segundos
  pdf_download_duration: Histogram;
  meta_upload_duration: Histogram;
  
  // Taxas
  delivery_success_rate: Gauge; // % de COMPLETED / total
  delivery_failure_rate: Gauge;
  
  // Erros
  errors_by_type: Counter; // tipo: PDF_DOWNLOAD, META_UPLOAD, etc
  retry_count: Counter;
  
  // Negócio
  pending_deliveries: Gauge; // entregas aguardando delivered
  expired_deliveries: Counter;
}
```

### Logs Estruturados

```typescript
// Formato JSON para cada evento
{
  "timestamp": "2026-03-10T16:30:00Z",
  "level": "info",
  "service": "form-webhook-processor",
  "event": "form_submission_received",
  "traceId": "trace_abc123",
  "data": {
    "organizationId": "org_123",
    "instanceId": "wa_456",
    "submissionId": "sub_789",
    "phone": "5511999999999"
  }
}
```

### Alertas Recomendados

| Condição | Severidade | Ação |
|----------|------------|------|
| Taxa de erro > 5% em 5min | P1 | PagerDuty, investigar imediatamente |
| Pending deliveries > 1000 | P2 | Escalar capacidade, verificar gargalo |
| PDF download falhando > 10% | P2 | Verificar URLs do sistema externo |
| Rate limit Meta atingido | P3 | Verificar quota, considerar throttling |

---

## 🔗 Referências

### Documentação Meta

- [Send Document Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/document-messages) - Guia oficial de envio de documentos
- [Media Upload API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#upload-media) - Upload de mídia não-resumable
- [Resumable Upload API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#resumable-upload-media) - Para arquivos grandes (> 100MB)
- [Webhook Events](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples) - Exemplos de payloads de webhook
- [Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/error-codes) - Lista completa de códigos de erro

### Documentação Interna

- `lib/whatsapp/cloud-api.ts` - Cliente existente da Meta API
- `app/api/whatsapp/webhooks/route.ts` - Handler de webhooks existente
- `prisma/schema.prisma` - Schema atual do banco

### RFCs e Decisões

- ADR-001: Escolha de tabela vs fila de mensagens
- ADR-002: Download síncrono vs assíncrono
- ADR-003: Upload resumable vs non-resumable

---

## 📅 Timeline Estimada

| Fase | Duração | Responsável | Dependências |
|------|---------|-------------|--------------|
| Fase 1: Schema | 1 dia | @architect | - |
| Fase 2.1-2.2: Helpers | 1 dia | @dev | Fase 1 |
| Fase 2.3-2.4: Endpoint | 2 dias | @dev | Fase 2.1-2.2 |
| Fase 2.5-2.6: Integração | 2 dias | @dev | Fase 2.3-2.4 |
| Fase 3: Testes | 2 dias | @qa + @dev | Fase 2 |
| **Total** | **8 dias** | | |

---

## 📝 Notas de Implementação

### Idempotência
O endpoint deve suportar idempotência via header `Idempotency-Key`. Se o mesmo `submissionId` for recebido dentro de 24h, retornar o resultado anterior sem reprocessar.

### Compatibilidade com Webhooks Existentes
A modificação no `app/api/whatsapp/webhooks/route.ts` deve ser retrocompatível. Não alterar comportamento existente, apenas adicionar o check de pendências.

### Segurança do PDF
URLs de PDF são temporárias e podem conter tokens. Não logar URLs completas em produção (truncar ou hashear).

### Cleanup de Pendências
Implementar job diário para expirar entregas com mais de 24h em status WAITING. Usar cron ou trigger do PostgreSQL.

---

**Documento criado por:** @pm  
**Revisado por:** @architect, @dev, @qa  
**Aprovado para implementação:** [ ] Sim [ ] Não (pendências: ___)
