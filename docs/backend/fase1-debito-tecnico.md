# Débito Técnico - Endpoints Restantes para Refatoração

> **Documento de débito técnico da Fase 1**
> 
> Este documento lista todos os endpoints que ainda precisam ser refatorados para remover o aceite de `organizationId` do cliente.

---

## 📊 Resumo

| Tipo de Issue | Quantidade | Status |
|---------------|------------|--------|
| QUERY_PARAM | 25 | ⏳ Pendente |
| FALLBACK_ORG | 4 | ⏳ Pendente |
| **Total** | **29** | **⏳ Pendente** |

---

## 📋 Endpoints com Query Param (25)

| # | Endpoint | Linha | Descrição | Prioridade |
|---|----------|-------|-----------|------------|
| 1 | `app/api/charges/route.ts` | 110 | `organizationId` via query param | Média |
| 2 | `app/api/custom-fields/route.ts` | 148 | `organizationId` via query param | Média |
| 3 | `app/api/dashboard/ai-insights/route.ts` | 12 | `organizationId` via query param | Baixa |
| 4 | `app/api/dashboard/all/route.ts` | 20 | `organizationId` via query param | Baixa |
| 5 | `app/api/dashboard/charts/route.ts` | 12 | `organizationId` via query param | Baixa |
| 6 | `app/api/dashboard/funil-por-etapa/route.ts` | 31 | `organizationId` via query param | Baixa |
| 7 | `app/api/dashboard/metrics/route.ts` | 12 | `organizationId` via query param | Baixa |
| 8 | `app/api/form-submissions/history/route.ts` | 17 | `organizationId` via query param | Média |
| 9 | `app/api/form-submissions/pending/route.ts` | 16 | `organizationId` via query param | Média |
| 10 | `app/api/form-submissions/stats/route.ts` | 17 | `organizationId` via query param | Média |
| 11 | `app/api/instagram/auth/route.ts` | 12 | `organizationId` via query param (com fallback) | Média |
| 12 | `app/api/instagram/instances/route.ts` | 11 | `organizationId` via query param (com fallback) | Média |
| 13 | `app/api/integrations/route.ts` | 162 | `organizationId` via query param | Média |
| 14 | `app/api/integrations/[id]/logs/route.ts` | 111 | `organizationId` via query param | Média |
| 15 | `app/api/integrations/[id]/route.ts` | 206, 427 | `organizationId` via query param (2x) | Média |
| 16 | `app/api/invoices/route.ts` | 71 | `organizationId` via query param | Média |
| 17 | `app/api/lists/route.ts` | 130 | `organizationId` via query param | Média |
| 18 | `app/api/schedules/route.ts` | 134 | `organizationId` via query param | Média |
| 19 | `app/api/segments/route.ts` | 129 | `organizationId` via query param | Média |
| 20 | `app/api/subscriptions/route.ts` | 105 | `organizationId` via query param | Média |
| 21 | `app/api/whatsapp/instances/route.ts` | 17 | `organizationId` via query param | Média |
| 22 | `app/api/whatsapp/logs/route.ts` | 16 | `organizationId` via query param | Baixa |
| 23 | `app/api/whatsapp/logs/stats/route.ts` | 16 | `organizationId` via query param | Baixa |
| 24 | `app/api/whatsapp/status/route.ts` | 32 | `organizationId` via query param | Média |
| 25 | `app/api/whatsapp/templates/route.ts` | 55 | `organizationId` via query param | Média |

---

## 📋 Endpoints com Fallback default_org_id (4)

| # | Endpoint | Linha | Descrição | Prioridade |
|---|----------|-------|-----------|------------|
| 1 | `app/api/contatos/import/route.ts` | 72 | Fallback para `default_org_id` | Média |
| 2 | `app/api/instagram/auth/route.ts` | 12 | Fallback para `default_org_id` | Média |
| 3 | `app/api/instagram/instances/route.ts` | 11 | Fallback para `default_org_id` | Média |
| 4 | `app/api/ai-insights/route.ts` | 397 | `organizationId` via body | Baixa |

---

## 🎯 Ordem de Prioridade

### 🔴 Prioridade Alta (fazer primeiro quando voltar)

1. `app/api/contatos/import/route.ts` - Importação em massa
2. `app/api/integrations/route.ts` - Integrações principais
3. `app/api/integrations/[id]/route.ts` - CRUD de integrações
4. `app/api/lists/route.ts` - Listas de contatos
5. `app/api/whatsapp/instances/route.ts` - Instâncias WhatsApp

### 🟡 Prioridade Média

6. `app/api/form-submissions/*/route.ts` - Envios de formulários
7. `app/api/schedules/route.ts` - Agendamentos
8. `app/api/segments/route.ts` - Segmentos
9. `app/api/invoices/route.ts` - Faturas
10. `app/api/subscriptions/route.ts` - Assinaturas

### 🟢 Prioridade Baixa (dashboard/reports)

11. `app/api/dashboard/*/route.ts` - Todos os endpoints de dashboard
12. `app/api/whatsapp/logs/route.ts` - Logs
13. `app/api/whatsapp/logs/stats/route.ts` - Estatísticas de logs
14. `app/api/ai-insights/route.ts` - Insights de IA

---

## 📝 Quando Voltar a Este Débito Técnico

### Gatilhos para Refatoração

1. **Antes de adicionar novo tenant** - Garantir isolamento completo
2. **Durante manutenção** - Refatorar gradualmente
3. **Após Fase 2 (RLS)** - Com segurança do banco implementada
4. **Sprint dedicado** - Se houver tempo técnico

### Processo de Refatoração Gradual

```
1. Pegue 1 endpoint da lista
2. Aplique o padrão de refatoração (ver fase1-guia-refatoracao.md)
3. Teste o endpoint
4. Marque como concluído neste documento
5. Commite com mensagem clara: "refactor(api): remove orgId param from /api/xxx"
6. Repita
```

---

## ✅ Template para Marcar Progresso

Ao refatorar um endpoint, atualize este documento:

```markdown
| 1 | `app/api/charges/route.ts` | 110 | ✅ Refatorado em 18/03/2026 |
```

---

## 📊 Progresso

```
[██████████░░░░░░░░░░] 33% (13/39 issues resolvidas)

Críticos:    [████████████] 100% (13/13) ✅
Alta:        [░░░░░░░░░░░░] 0%   (0/5)
Média:       [░░░░░░░░░░░░] 0%   (0/12)
Baixa:       [░░░░░░░░░░░░] 0%   (0/9)
```

---

## 🔗 Documentos Relacionados

- `fase1-guia-refatoracao.md` - Guia passo a passo
- `fase1b-resumo.md` - Resumo da refatoração dos críticos
- `fase1-plano.md` - Plano completo da Fase 1

---

## 🏁 Próximo Endpoint a Refatorar (Sugestão)

Quando for voltar a este débito técnico, comece por:

**`app/api/integrations/route.ts`**

- É o #1 da prioridade alta
- Usado em várias partes do sistema
- Impacto alto na segurança

Padrão já está definido em `fase1-guia-refatoracao.md`.
