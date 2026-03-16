# Status do Plano de Migração - Mock → Supabase

**Atualizado em:** 2026-03-13

---

## 🎯 Sprints - Status Geral

```
Sprint 1 - Contatos:        ████████████████████ 100% ✅ CONCLUÍDO
Sprint 2 - CRM/Pipeline:    ████████████████████ 100% ✅ CONCLUÍDO
Sprint 3 - Conversas:       ████████████████████ 100% ✅ CONCLUÍDO
Sprint 4 - Integrações:     ████████████████████ 100% ✅ CONCLUÍDO (13/03)
Sprint 5 - Cobranças:       ████████████████████ 100% ✅ CONCLUÍDO (13/03)
Sprint 6 - Dashboard:       ░░░░░░░░░░░░░░░░░░░░   0% ⏳ PENDENTE
```

---

## ✅ SPRINTS CONCLUÍDOS

### Sprint 1 - Contatos ✅
- Tabelas: `tags`, `contact_tags`, `lists`, `list_contacts`, `custom_field_definitions`, `contact_custom_field_values`, `segments`
- APIs: `/api/contacts`, `/api/tags`, `/api/lists`, `/api/custom-fields`, `/api/segments`
- Hooks: `useContacts`, `useTags`, `useLists`
- Mocks removidos: `contacts.ts`, `tags.ts`, `lists.ts`, `custom-fields.ts`, `segments.ts`, `trash.ts`, `mock-leads-enriched.ts`, `mock-tags.ts`

### Sprint 2 - CRM/Pipeline ✅
- Tabelas: `pipeline_stages`, `deals`, `deal_activities`, `schedules`
- APIs: `/api/pipeline/*`, `/api/schedules/*`
- Hooks: `usePipeline`, `useSchedules`
- Pages: `/pipeline`, `/agendamentos/*`

### Sprint 3 - Conversas ✅
- Tabelas: `conversations`, `messages`, `transcriptions`
- APIs: `/api/conversations`, `/api/conversations/[id]`
- Hooks: `useConversations`
- Mocks removidos: `mock-conversations.ts`, `mock-transcriptions.ts`
- Pages: `/conversas` e sub-rotas

### Sprint 4 - Integrações ✅ (13/03/2026)
- Tabelas: `integrations`, `integration_configs` (criadas via SQL)
- APIs: `/api/integrations`, `/api/integrations/[id]`, `/api/integrations/[id]/logs`
- Hooks: `useIntegrations`
- Seed: 48 integrações criadas (6 tipos × 8 orgs)
- Migration: `migrations/sprint4_integrations_fixed.sql` ✅

### Sprint 5 - Cobranças ✅ (13/03/2026)
- Tabelas: `plans`, `subscriptions`, `invoices`, `charges`, `coupons`, `subscription_coupons` ✅
- APIs: `/api/plans`, `/api/subscriptions`, `/api/invoices`, `/api/charges`, `/api/coupons`
- Hooks: `usePlans`, `useSubscriptions`, `useInvoices`, `useCharges`, `useCoupons`
- Seed: 3 planos (Básico, Pro, Enterprise) + 2 cupons ✅
- Migration: `migrations/sprint5_billing.sql` ✅
- Pages: `/cobrancas`, `/configuracoes/assinaturas/*`
- Testes: 164 testes passando ✅
- Build: 156 rotas geradas com sucesso ✅

---

## ⏳ SPRINT FALTANTE

### Sprint 6 - Dashboard e Métricas (PENDENTE)

**O que falta fazer:**

#### 1. Schema SQL
- [ ] Criar migration `migrations/sprint6_dashboard.sql`
- [ ] Criar view ou tabela `dashboard_metrics`
- [ ] Definir estrutura para KPIs (contatos, conversas, pipeline, receita)

#### 2. APIs
- [ ] Criar `app/api/dashboard/metrics/route.ts` - Retorna métricas agregadas
- [ ] Criar `app/api/dashboard/charts/route.ts` - Dados para gráficos
- [ ] Criar `app/api/ai-insights/route.ts` - Insights de IA (se necessário)

#### 3. Hooks
- [ ] Criar `hooks/use-dashboard.ts` - Hook para métricas do dashboard
- [ ] Criar `hooks/use-ai-insights.ts` - Hook para insights (se necessário)

#### 4. Remover Mocks
- [ ] Remover `lib/mock-charts-data.ts`
- [ ] Remover `lib/mock-ai-insights.ts`

#### 5. Conectar Pages
- [ ] Atualizar `app/dashboard/page.tsx` - Usar dados reais das APIs
- [ ] Garantir que gráficos funcionam com poucos dados (edge case)

#### 6. Testes
- [ ] Criar testes para APIs do dashboard
- [ ] Criar testes para hooks do dashboard
- [ ] Rodar `npm run lint && npm run typecheck` ✅

---

## 📊 Critérios de Conclusão do Projeto

### Status Atual

| Critério | Status | Detalhes |
|----------|--------|----------|
| Zero imports de arquivos mock | ⏳ Parcial | Falta remover `mock-charts-data.ts`, `mock-ai-insights.ts` |
| Todas APIs retornam dados reais | ⏳ Parcial | Falta APIs do dashboard |
| CRUD funcional em todas telas | ⏳ Parcial | Falta dashboard com dados reais |
| Soft delete em contatos | ✅ OK | Implementado |
| RLS habilitado | ⏳ Pendente | Verificar tabelas novas |
| Seed executado | ✅ OK | Sprints 1-5 OK |
| Sem erros nas telas | ✅ OK | |
| Estados vazios tratados | ✅ OK | |
| `npm run lint` | ⚠️ Verificar | Rodar após Sprint 6 |
| `npm run typecheck` | ⚠️ Verificar | Rodar após Sprint 6 |

---

## 🎯 Próximos Passos

1. **Executar Sprint 6** - Dashboard e Métricas
2. **Verificar RLS** - Garantir Row Level Security em todas as tabelas
3. **Teste final** - Rodar lint, typecheck e testes completos
4. **Deploy** - Publicar em produção

**Tempo estimado para conclusão:** 2-4 horas
