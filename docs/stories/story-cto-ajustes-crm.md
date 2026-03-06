# Story: Ajustes CRM — Remoção de Email, Lead Score e Correção de Sidebar

**ID:** STORY-CTO-AJUSTES-001
**Módulo:** CRM Global
**Status:** 🟡 Planejado
**Data:** 2026-03-06
**Projeto:** NexIA Chat — CRM Dashboard
**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Radix UI · shadcn/ui
**Solicitante:** CTO
**Prioridade:** Alta

---

## Origem

Solicitação direta da CTO via mensagem (06/03/2026). Três problemas identificados:

> "essa gestão de emails não vai ter no crm, então preciso retirar tudo"
> "esse menu lateral ta bem inconsistente, fica recolhendo e expandindo meio bugado"
> "tudo sobre LEAD SCORE precisa ser analisado e removido"

---

## Escopo das Alterações

### TASK-01 — Remover Gestão de Emails do CRM

**Agente responsável:** @dev
**Agente revisor:** @qa

A CTO confirmou que o CRM **não terá módulo de gestão de emails**. Todos os elementos de email management devem ser removidos. Email como campo de dado de contato (endereço de email) pode ser mantido — o que deve ser removido são funcionalidades de *envio, rastreamento e canal de email*.

#### Arquivos afetados e o que remover:

| Arquivo | O que remover |
|---------|--------------|
| `components/contacts/contacts-table.tsx:198` | Ação "Enviar Email" no dropdown de ações da linha |
| `components/contact-detail-panel.tsx:730` | Botão com ícone `Mail` na toolbar da timeline |
| `components/conversation-volume-chart.tsx:26,80,82,106,107` | Série "email" do gráfico de volume (chave, cor, barra, legenda) |
| `lib/types/contact.ts:69,71` | Campos `emailsAbertos` e `emailsClicados` do tipo ContactActivity |
| `lib/tag-utils.ts:423` | Comentário/peso referente a "emails" no cálculo de engajamento |
| `lib/mock-ai-insights.ts` | Qualquer referência a rastreamento de email |

#### Critérios de aceitação:
- [ ] Nenhum botão, ação ou menu com "Enviar Email" visível no CRM
- [ ] Gráfico de volume de conversas não exibe canal "Email"
- [ ] Campos de rastreamento de email removidos dos tipos TypeScript
- [ ] Sem erros de build ou TypeScript após remoção
- [ ] Campos de endereço de email de contato (dado cadastral) mantidos intactos

---

### TASK-02 — Remover Lead Score / Pontuação de Leads

**Agente responsável:** @dev
**Agente revisor:** @qa

A CTO solicitou remoção **completa** de tudo relacionado a Lead Score nesta versão. A funcionalidade será redesenhada futuramente de forma mais completa.

#### Mapa completo de remoções:

**Navegação / UI:**
| Arquivo | O que remover |
|---------|--------------|
| `components/contacts/contacts-sub-sidebar.tsx:47` | Item "Pontuação" do array `manageNavItems` + import `BarChart3` se não usado |
| `components/contacts/contacts-table.tsx:75` | Coluna `<TableHead>Lead Score</TableHead>` e célula correspondente |
| `components/contact-detail-panel.tsx:694-708` | Bloco inteiro "Lead Score Section" |
| `components/recent-leads.tsx:143` | Badge de Lead Score |
| `components/ai-insights-panel.tsx:41` | Referência `lead score ≥80` na descrição do insight |

**Páginas:**
| Arquivo | Ação |
|---------|------|
| `app/contatos/pontuacao/page.tsx` | Remover arquivo (página completa de scoring) |

**Dados e tipos:**
| Arquivo | O que remover |
|---------|--------------|
| `lib/mock/scoring-rules.ts` | Arquivo inteiro (mock de regras de scoring) |
| `lib/types/contact.ts` | Campo `leadScore` do tipo Contact; campos de scoring |
| `lib/tag-utils.ts` | Referências a scoring/pontuação no cálculo de tags |
| `lib/calculations/kpi-calculator.ts` | Cálculos relacionados a lead score |
| `lib/mock/segments.ts` | Segmentos baseados em lead score |
| `lib/mock/custom-fields.ts` | Campos customizados de pontuação |
| `lib/mock-ai-insights.ts` | Insights baseados em lead score |

**Pages com referências pontuais:**
| Arquivo | O que remover |
|---------|--------------|
| `app/contatos/tags/page.tsx` | Referências a lead score em tags |
| `app/contatos/exportar/page.tsx` | Campo/coluna lead score na exportação |
| `app/contatos/novo/page.tsx` | Campo lead score no formulário de novo contato |

#### Critérios de aceitação:
- [ ] Rota `/contatos/pontuacao` retorna 404 (arquivo removido)
- [ ] Item "Pontuação" não aparece no sub-sidebar de contatos
- [ ] Nenhuma coluna, badge ou seção "Lead Score" visível em qualquer página
- [ ] Sem erros de TypeScript após remoção dos campos dos tipos
- [ ] Build completo sem erros
- [ ] Imports órfãos (`BarChart3`, `Flame`, `Thermometer`, `Snowflake` da página pontuacao) removidos

---

### TASK-03 — Corrigir Inconsistência da Sidebar Principal

**Agente responsável:** @dev
**Agente revisor:** @qa

**Problema:** A sidebar principal (`components/sidebar.tsx`) tem comportamento inconsistente. Ao clicar em um item de navegação que possui sub-sidebar, o `handleNavClick` força o colapso automático da sidebar (`setCollapsed(true)`). Isso gera a percepção de "abre e fecha" porque:
1. O usuário pode ter expandido manualmente a sidebar
2. Ao clicar em qualquer item de navegação com sub-sidebar, ela colapsa automaticamente
3. O comportamento não é previsível — a sidebar muda de estado sem o usuário ter clicado no toggle

**Causa raiz:**
```typescript
// components/sidebar.tsx — handleNavClick (linha ~108)
const handleNavClick = (key: NavItemKey, href: string) => {
  if (routesWithSubSidebar.includes(key) && !isCollapsed) {
    setCollapsed(true)  // <-- força colapso automático sem intenção do usuário
  }
  router.push(href)
}
```

**Solução:** Remover o comportamento de auto-colapso. A sidebar deve manter seu estado atual (colapsada ou expandida) ao navegar. O usuário controla manualmente via botão de toggle. A sub-sidebar já tem seu próprio espaço no layout, não há necessidade de forçar colapso da sidebar principal.

#### Alterações necessárias:

| Arquivo | Alteração |
|---------|-----------|
| `components/sidebar.tsx` | Simplificar `handleNavClick` — remover lógica de auto-colapso, apenas chamar `router.push(href)` |

```typescript
// ANTES (bugado)
const handleNavClick = (key: NavItemKey, href: string) => {
  if (routesWithSubSidebar.includes(key) && !isCollapsed) {
    setCollapsed(true)
  }
  router.push(href)
}

// DEPOIS (correto)
const handleNavClick = (key: NavItemKey, href: string) => {
  router.push(href)
}
```

Se o array `routesWithSubSidebar` e o import `setCollapsed` ficarem sem uso após a mudança, removê-los também.

#### Critérios de aceitação:
- [ ] Clicar em qualquer item de navegação não altera o estado de colapso da sidebar
- [ ] A sidebar mantém o estado que o usuário definiu (colapsada ou expandida)
- [ ] O botão de toggle continua funcionando normalmente
- [ ] Estado é persistido no localStorage entre navegações
- [ ] Sem comportamento de abertura/fechamento não intencional

---

## Plano de Execução AIOS

### Sequência recomendada

```
@dev TASK-02 (Lead Score) → @qa review
        ↓
@dev TASK-01 (Email) → @qa review
        ↓
@dev TASK-03 (Sidebar) → @qa review
        ↓
@dev build final + lint check
```

**Racional da ordem:**
- TASK-02 é a maior (mais arquivos) — fazer primeiro garante tipos limpos para as demais
- TASK-01 é média — depende dos tipos já limpos
- TASK-03 é cirúrgica — uma mudança de poucas linhas, fazer por último reduz risco de conflito

### Comandos de validação após cada task

```bash
npm run typecheck   # zero erros TypeScript
npm run lint        # zero warnings/errors
npm run build       # build completo sem falhas
```

---

## Arquivos a NÃO modificar

| Arquivo | Motivo |
|---------|--------|
| `app/contatos/novo/page.tsx` — campo de email do contato | Email como dado cadastral do contato é mantido |
| `components/leads/quick-lead-modal.tsx` — campo email | Dado cadastral, não gestão de email |
| `app/conversas/nova/page.tsx` — campo email | Dado cadastral do contato |
| `lib/whatsapp/webhook-handler.ts` — emails no payload | Integração WhatsApp, não gestão de email |
| `app/integracoes/nova/page.tsx` — "Integre emails da sua conta Google" | Integração de canal (não é CRM email management) |

---

## Riscos e Dependencias

| Risco | Mitigação |
|-------|-----------|
| Tipos com `leadScore` usados em muitos lugares | Fazer remoção de dentro pra fora: tipos primeiro, depois UI |
| `lib/mock/scoring-rules.ts` pode ser importado por outros arquivos | Verificar todos os imports antes de deletar o arquivo |
| Remoção do canal Email do gráfico pode quebrar tipagem dos dados mock | Atualizar mock data junto com a série do gráfico |
| Sidebar: remover `routesWithSubSidebar` pode gerar variável não usada | Remover declaração completa da variável |

---

## Definition of Done

- [ ] Todas as 3 tasks com critérios de aceitação satisfeitos
- [ ] `npm run typecheck` — zero erros
- [ ] `npm run lint` — zero erros/warnings
- [ ] `npm run build` — build completo
- [ ] Nenhuma referência visual a Lead Score/Pontuação no app
- [ ] Nenhuma referência visual a Email Management/Canal Email no CRM
- [ ] Sidebar estável — sem abrir/fechar automático
- [ ] Commit com mensagem clara referenciando esta story
