# CICLO 12 — Webhook de Formulário com Envio de PDF via WhatsApp

## Branch
`feat/ciclo-12-webhook-formulario-pdf`

## Agentes AIOS Responsáveis

| Agente | Papel neste ciclo |
|--------|-------------------|
| `@architect` | Define estrutura da tabela `PendingFormDelivery`, padrão de integração async e decisões de design |
| `@dev` | Implementa todos os arquivos: endpoint, processor, media upload, modificação no webhook handler |
| `@qa` | Valida fluxo end-to-end, edge cases, tratamento de erro e idempotência |
| `@analyst` | Documenta o fluxo de dados para o CTO e valida se os requisitos de negócio estão cobertos |
| `@devops` | Garante que as variáveis de ambiente estão corretas na VPS e que nenhum serviço extra é necessário |
| `@pm` / `@po` | Validam se o entregável cobre o caso de uso do negócio (integração Typeform → CRM) |
| `@sm` | Controla o progresso das tasks, atualiza checkboxes, comunica bloqueios |

> **Como ativar cada agente:** use a sintaxe `@nome-do-agente` no chat. Ex: `@architect` para pedir uma decisão técnica, `@dev` para executar uma task, `@qa` para rodar a validação.

---

## Entregável

Sistema que recebe um webhook do Typeform contendo dados de um lead e a URL de um PDF, inicia uma conversa via **template aprovado da Meta**, aguarda a confirmação de entrega (`delivered`), e então envia o PDF como documento na mesma janela de conversa — tudo dentro da infraestrutura Next.js existente, sem nenhum serviço adicional na VPS.

---

## Por que essa decisão? (Para o CTO)

### Problema
O time precisa que, ao um lead preencher um formulário no Typeform, o CRM automaticamente:
1. Abra uma conversa WhatsApp com esse lead
2. Envie o PDF do formulário preenchido

Fazer isso manualmente é inviável em escala.

### Decisão Arquitetural: tudo no Next.js, sem serviço separado

**O que foi avaliado:**

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| Novo serviço Node na VPS (porta separada) | Isolamento total | Mais infra, deploy separado, mais pontos de falha | ❌ Descartado |
| Worker externo (BullMQ + Redis) | Escalável, retry nativo | Requer Redis na VPS, complexidade operacional desproporcional | ❌ Descartado por agora |
| **Rota Next.js + banco Postgres** | Zero infra nova, mesmo deploy, banco já existe | Sem retry automático (mitigado por tratamento de erro) | ✅ **Escolhido** |

**Justificativa da escolha:**
- O Next.js já está rodando como servidor HTTP na VPS — uma nova rota `/api/webhooks/form-submission` é simplesmente mais uma rota no mesmo processo.
- O Postgres já existe no projeto (Prisma). Persistir o estado "aguardando entrega" é uma operação trivial.
- O volume esperado de formulários não justifica a complexidade de um worker assíncrono dedicado.
- Se o volume crescer no futuro, a migração para BullMQ/Redis é incremental — a lógica de negócio já estará isolada em `lib/whatsapp/form-webhook-processor.ts`.

### Por que esperar o `delivered` antes de enviar o PDF?

A Meta exige que a janela de conversa seja aberta antes de mensagens fora de template serem enviadas. O evento `delivered` confirma que o template chegou ao dispositivo do usuário e que a janela de 24h está ativa. Enviar o PDF antes disso resultaria em erro 131026 da API da Meta ("Message failed to send because more than 24 hours have passed").

### Segurança
O endpoint do Typeform é protegido por token secreto no header. Apenas o Typeform com o `FORM_WEBHOOK_SECRET` correto consegue disparar o fluxo.

---

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ [1] Typeform envia POST para /api/webhooks/form-submission       │
│     Payload: { secret, phone, name, organizationId,             │
│               templateName, templateLanguage,                    │
│               templateVariables[], pdfUrl }                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ [2] form-webhook-processor.ts                                    │
│     • Valida o secret                                            │
│     • Busca WhatsAppInstance ativa da organizationId             │
│     • Cria/busca Contact no banco                                │
│     • Envia Template Message via Meta Cloud API                  │
│     • Salva PendingFormDelivery no banco                         │
│       { messageId, pdfUrl, phone, instanceId, status: WAITING }  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (assíncrono — aguarda webhook da Meta)
┌─────────────────────────────────────────────────────────────────┐
│ [3] Meta envia status "delivered" para /api/whatsapp/webhooks    │
│     (webhook existente do projeto)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ [4] webhook-handler.ts (modificado)                              │
│     • Ao processar evento de status "delivered":                 │
│       - Consulta PendingFormDelivery pelo messageId              │
│       - Se encontrado e status = WAITING:                        │
│         → Baixa o PDF da pdfUrl                                  │
│         → Faz upload do PDF na Meta (media upload API)           │
│         → Envia Document Message com o media_id                  │
│         → Atualiza PendingFormDelivery para COMPLETED            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar / Modificar

### Novos arquivos

| Arquivo | Agente | Descrição |
|---------|--------|-----------|
| `app/api/webhooks/form-submission/route.ts` | `@dev` | Endpoint POST que recebe o Typeform |
| `lib/whatsapp/form-webhook-processor.ts` | `@dev` | Lógica de negócio do fluxo (validação, template, persistência) |
| `lib/whatsapp/media-upload.ts` | `@dev` | Helper para upload de PDF na Meta Graph API |

### Arquivos a modificar

| Arquivo | Agente | O que muda |
|---------|--------|------------|
| `prisma/schema.prisma` | `@dev` + `@architect` | Adiciona model `PendingFormDelivery` |
| `lib/whatsapp/webhook-handler.ts` | `@dev` | Adiciona verificação de PendingFormDelivery nos eventos de `delivered` |
| `.env.local.example` | `@devops` | Adiciona `FORM_WEBHOOK_SECRET` |

---

## Schema da Nova Tabela

```prisma
model PendingFormDelivery {
  id             String    @id @default(cuid())
  messageId      String    @unique  // ID retornado pela Meta ao enviar o template
  organizationId String
  instanceId     String
  phone          String
  pdfUrl         String
  status         PendingFormDeliveryStatus @default(WAITING)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  completedAt    DateTime?
  errorMessage   String?

  organization   Organization      @relation(fields: [organizationId], references: [id])
  instance       WhatsAppInstance  @relation(fields: [instanceId], references: [id])

  @@index([messageId])
  @@index([organizationId])
  @@index([status])
}

enum PendingFormDeliveryStatus {
  WAITING     // Template enviado, aguardando delivered
  PROCESSING  // PDF sendo enviado
  COMPLETED   // PDF enviado com sucesso
  FAILED      // Erro após tentativas
}
```

---

## Payload Esperado do Typeform

```json
{
  "secret": "SEU_FORM_WEBHOOK_SECRET",
  "phone": "5511999999999",
  "name": "João Silva",
  "organizationId": "org_cxxxxxxxxxxxxxxx",
  "templateName": "envio_formulario",
  "templateLanguage": "pt_BR",
  "templateVariables": ["João"],
  "pdfUrl": "https://api.typeform.com/forms/.../responses/.../fields/.../download"
}
```

> **Como configurar no Typeform:** criar um campo hidden `organizationId` com o ID da organização. A URL do webhook é `https://seudominio.com.br/api/webhooks/form-submission`. O `secret` vai no campo de assinatura do Typeform (ou como query param de fallback).

---

## Variáveis de Ambiente

```bash
# Segredo compartilhado com o Typeform para validar o webhook
FORM_WEBHOOK_SECRET=gerar-um-uuid-v4-aqui
```

---

## Tasks de Execução

### Fase 1 — Arquitetura e Schema (responsável: `@architect` + `@dev`)
- [ ] Revisar e validar o schema `PendingFormDelivery`
- [ ] Aplicar migration: `npx prisma migrate dev --name add-pending-form-delivery`
- [ ] Confirmar que `WhatsAppInstance` precisa de relação com `PendingFormDelivery`

### Fase 2 — Implementação Core (responsável: `@dev`)
- [ ] Criar `lib/whatsapp/media-upload.ts`
- [ ] Criar `lib/whatsapp/form-webhook-processor.ts`
- [ ] Criar `app/api/webhooks/form-submission/route.ts`
- [ ] Modificar `lib/whatsapp/webhook-handler.ts` para checar pendências no `delivered`

### Fase 3 — Integração e Testes (responsável: `@qa`)
- [ ] Testar endpoint com payload simulado (sem Meta real)
- [ ] Validar que PendingFormDelivery é criado corretamente
- [ ] Simular evento `delivered` e verificar se PDF é enviado
- [ ] Testar edge cases: PDF URL inválida, template não existe, phone inválido
- [ ] Testar idempotência: dois eventos `delivered` para o mesmo `messageId`

### Fase 4 — Deploy e Validação em Produção (responsável: `@devops`)
- [ ] Adicionar `FORM_WEBHOOK_SECRET` no `.env` da VPS
- [ ] Rodar migration em produção: `npx prisma migrate deploy`
- [ ] Registrar URL do webhook no Typeform
- [ ] Fazer um submit de teste real e acompanhar logs

### Fase 5 — Documentação (responsável: `@analyst`)
- [ ] Atualizar `docs/WHATSAPP_EMBEDDED_SIGNUP.md` com a nova funcionalidade
- [ ] Documentar como configurar o Typeform com o campo `organizationId`
- [ ] Registrar códigos de erro conhecidos da Meta API

---

## Critérios de Aceite

| # | Critério | Como validar |
|---|----------|--------------|
| 1 | Endpoint recebe POST do Typeform e retorna 200 | Curl / Typeform test |
| 2 | Template é enviado corretamente ao número | Ver no WhatsApp do lead |
| 3 | PDF é enviado após evento `delivered` | Ver no WhatsApp + banco |
| 4 | `PendingFormDelivery` tem status `COMPLETED` ao final | Query no banco |
| 5 | Segundo evento `delivered` não reenvia o PDF | Testar idempotência |
| 6 | Payload inválido ou secret errado retorna 401/400 | Curl com token errado |
| 7 | PDF URL inacessível salva erro em `errorMessage` | Testar com URL quebrada |
| 8 | Funciona para múltiplas organizações (multi-tenant) | Testar com 2 orgs |

---

## Códigos de Erro da Meta a Tratar

| Código | Descrição | Tratamento |
|--------|-----------|------------|
| `131026` | Janela de 24h não aberta | Não enviar — salvar como FAILED |
| `131047` | Template não aprovado | Retornar erro 400 para o Typeform |
| `131051` | Tipo de mídia inválido | Verificar Content-Type do PDF antes do upload |
| `100` | Parâmetro inválido | Log detalhado + status FAILED |

---

## Referências

- [Meta — Send Document Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/document-messages)
- [Meta — Resumable Upload API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Meta — Template Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/template-messages)
- [Typeform — Webhooks](https://www.typeform.com/developers/webhooks/)

---

## Arquivo List (atualizado conforme execução)

| Arquivo | Status |
|---------|--------|
| `prisma/schema.prisma` | ⏳ Pendente |
| `app/api/webhooks/form-submission/route.ts` | ⏳ Pendente |
| `lib/whatsapp/form-webhook-processor.ts` | ⏳ Pendente |
| `lib/whatsapp/media-upload.ts` | ⏳ Pendente |
| `lib/whatsapp/webhook-handler.ts` | ⏳ Pendente |
| `.env.local.example` | ⏳ Pendente |
