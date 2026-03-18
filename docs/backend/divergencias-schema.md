# Divergencias Schema Prisma vs Banco Real

> **Data:** 18/03/2026, 10:32:45
> **Banco:** 49.13.228.89:5432
> **Gerado por:** scripts/fase0-auditoria.ts

---

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Total de Tabelas | 25 |
| Tabelas com RLS Ativo | 4 |
| Usuarios Orfaos (sem OrganizationMember) | 1 |
| Organizacoes com Owner Invalido | 1 |
| Politicas RLS Existentes | 3 |

---

## 1. Coluna users.organization_id

**Status:** ✅ EXISTE

A coluna `organization_id` existe no banco de dados real, mas **NAO esta modelada no Prisma schema** atual.

**Detalhes:**
```json
[
  {
    "column_name": "organization_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  }
]
```

**Acao necessaria:**
Adicionar ao model User em `prisma/schema.prisma`:
```prisma
model User {
  // ... campos existentes
  organizationId String? @map("organization_id") @db.Uuid
  legacyOrganization   Organization? @relation("LegacyUserOrganization", fields: [organizationId], references: [id])
}
```

---

## 2. Tabelas no Banco vs Prisma Schema

### Tabelas existentes no banco (25):

| Tabela | Colunas | RLS Ativo | Politicas |
|--------|---------|-----------|-----------|
| charges | 12 | ❌ | 0 |
| contact_tags | 4 | ❌ | 0 |
| contacts | 13 | ❌ | 0 |
| conversations | 7 | ❌ | 0 |
| dashboard_metric_cache | 7 | ❌ | 0 |
| dashboard_metric_caches | 7 | ❌ | 0 |
| deal_activities | 7 | ❌ | 0 |
| deals | 34 | ❌ | 0 |
| invoices | 11 | ❌ | 0 |
| list_contacts | 4 | ❌ | 0 |
| lists | 10 | ❌ | 0 |
| messages | 15 | ❌ | 0 |
| monthly_goals | 13 | ❌ | 0 |
| organization_members | 8 | ✅ | 0 |
| organizations | 8 | ✅ | 0 |
| pipeline_stage_histories | 7 | ❌ | 0 |
| pipeline_stage_history | 6 | ❌ | 0 |
| pipeline_stages | 10 | ✅ | 0 |
| plans | 9 | ❌ | 0 |
| schedules | 15 | ❌ | 0 |
| segments | 10 | ❌ | 0 |
| subscriptions | 10 | ❌ | 0 |
| tags | 8 | ❌ | 0 |
| users | 44 | ✅ | 3 |
| whatsapp_cloud_instances | 7 | ❌ | 0 |

### Divergencias Identificadas:


**Tabelas no banco mas nao no Prisma schema (2):**

- `dashboard_metric_caches`
- `pipeline_stage_histories`


**Tabelas esperadas no Prisma mas nao encontradas no banco (16):**

- `organization_units`
- `whatsapp_cloud_templates`
- `whatsapp_cloud_logs`
- `instagram_instances`
- `meta_webhook_logs`
- `custom_field_definitions`
- `contact_custom_field_values`
- `pipeline_templates`
- `pipeline_template_stages`
- `ai_insights`
- `transcriptions`
- `integrations`
- `integration_configs`
- `integration_activity_logs`
- `coupons`
- `pending_form_deliveries`


---

## 3. Row Level Security (RLS)

### Status por Tabela:

| Tabela | RLS Ativo | Politicas | Observacao |
|--------|-----------|-----------|------------|
| charges | ❌ | 0 | Inativo |
| contact_tags | ❌ | 0 | Inativo |
| contacts | ❌ | 0 | 🔴 CRITICO: Dados sensiveis sem RLS |
| conversations | ❌ | 0 | 🔴 CRITICO: Dados sensiveis sem RLS |
| dashboard_metric_cache | ❌ | 0 | Inativo |
| dashboard_metric_caches | ❌ | 0 | Inativo |
| deal_activities | ❌ | 0 | Inativo |
| deals | ❌ | 0 | 🔴 CRITICO: Dados sensiveis sem RLS |
| invoices | ❌ | 0 | Inativo |
| list_contacts | ❌ | 0 | Inativo |
| lists | ❌ | 0 | Inativo |
| messages | ❌ | 0 | 🔴 CRITICO: Dados sensiveis sem RLS |
| monthly_goals | ❌ | 0 | Inativo |
| organization_members | ✅ | 0 | ✅ Protegida |
| organizations | ✅ | 0 | ✅ Protegida |
| pipeline_stage_histories | ❌ | 0 | Inativo |
| pipeline_stage_history | ❌ | 0 | Inativo |
| pipeline_stages | ✅ | 0 | Ativo |
| plans | ❌ | 0 | Inativo |
| schedules | ❌ | 0 | Inativo |
| segments | ❌ | 0 | Inativo |
| subscriptions | ❌ | 0 | Inativo |
| tags | ❌ | 0 | Inativo |
| users | ✅ | 3 | Ativo |
| whatsapp_cloud_instances | ❌ | 0 | Inativo |

### Politicas Existentes:

- **users.Service role can manage all users**: ALL (PERMISSIVE)
- **users.Users can read own data**: SELECT (PERMISSIVE)
- **users.Users can update own data**: UPDATE (PERMISSIVE)

**Acao necessaria:** Configurar RLS em todas as tabelas de dados conforme Fase 2 do plano.

---

## 4. Usuarios Orfaos (sem OrganizationMember)

**Total de usuarios orfaos:** 1

Estes usuarios tem `organization_id` legado mas nao tem registro em `organization_members`:

| User ID | Email | Legacy Org ID | Nome | Criado em |
|---------|-------|---------------|------|-----------|
| 549779df... | gabriel@gmail.com | ec8f9011... | gabriel | 13/03/2026 |

**Acao necessaria:** Executar script `scripts/migrate-org-members.ts` para criar OrganizationMember para cada usuario orfao.

---

## 5. Estatisticas de Membership

| Metrica | Valor |
|---------|-------|
| Total de Usuarios | 1 |
| Usuarios com organization_id legado | 1 |
| Usuarios com Membership | 0 |
| Usuarios Orfaos | 1 |

---

## 6. Organizacoes com Problemas de Owner

**1 organizacao(oes)** sem owner valido:

| Org ID | Nome | Owner ID | User Existe? | Tem Membership? |
|--------|------|----------|--------------|-----------------|
| ec8f9011... | Minha Empresa | 549779df... | ✅ | ❌ |

---

## 7. Volumes de Dados

| Tabela | Registros |
|--------|-----------|
| contacts | 2 |
| conversations | 0 |
| deals | 0 |
| messages | 0 |
| organization_members | 0 |
| organizations | 1 |
| users | 1 |
| whatsapp_cloud_instances | 0 |

---

## 8. Constraints Unique (potenciais problemas de soft-delete)

- **organizations.organizations_slug_key**: slug

**Nota:** Constraints unique em tabelas com soft-delete podem causar problemas ao tentar recriar registros deletados.

---

## Checklist de Acoes

- [ ] Adicionar `organizationId` ao model User no Prisma schema
- [ ] Executar script de migracao para usuarios orfaos
- [ ] Criar migrations para sincronizar schema
- [ ] Configurar RLS em todas as tabelas de dados (Fase 2)
- [ ] Corrigir organizacoes sem owner valido (se houver)

---

*Documento gerado automaticamente pelo script de auditoria da Fase 0.*