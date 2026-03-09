# CICLO 11 — Sidebar Fixa com Dropdowns Inline

## Branch
`feat/ciclo-11-sidebar-refactor`

## Agentes Responsáveis

| Agente | Papel |
|--------|-------|
| `@architect` | Decisões de arquitetura, padrão de componente dropdown |
| `@dev` | Implementação de todos os componentes e remoção de sub-sidebars |
| `@qa` | Validação de build, navegação e visual após cada fase |

## Entregável

Sidebar roxa principal **sempre fixa em 160px**, sem botão de colapso, com menus dropdown
accordion inline para todas as rotas que anteriormente utilizavam sub-sidebars separadas.
Sub-sidebars removidas completamente do codebase.

---

## Resumo da Mudança

**Situação atual:**
```
┌──────────────┬────────────────────┬──────────────────────────┐
│  Sidebar     │   Sub-Sidebar      │   Conteúdo               │
│  roxa        │   (220px)          │                          │
│  (40-160px)  │   por rota         │                          │
└──────────────┴────────────────────┴──────────────────────────┘
```

**Situação desejada:**
```
┌──────────────┬──────────────────────────────────────────────┐
│  Sidebar     │   Conteúdo                                   │
│  roxa fixa   │                                              │
│  (160px)     │                                              │
│  com         │                                              │
│  dropdowns   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Comportamento dos dropdowns:**
- Opção A (escolhida): **Auto-abre ao navegar** — ao entrar em uma rota, o grupo
  correspondente expande automaticamente na sidebar
- Estado manual: usuário pode fechar/abrir grupos livremente
- Múltiplos grupos podem ficar abertos simultaneamente

---

## Arquitetura do Componente Dropdown (@architect)

### Padrão Visual

```
┌──────────────────┐
│  ● Overview      │  ← item simples, sem dropdown
│  ● Contatos  ▾   │  ← clicável, expande/fecha
│    ├ Todos       │  ← sub-item com indentação
│    ├ Listas      │
│    ├ Segmentos   │
│    └ Tags        │
│  ● Conversas ▾   │  ← fechado (rota não ativa)
│  ● Pipeline      │  ← item simples
│  ● Agendamentos▾ │
│  ● Integrações ▾ │
│  ● Cobranças ▾   │
└──────────────────┘
```

### Interface TypeScript

```typescript
interface SidebarNavItem {
  key: string;
  label: string;
  href?: string;           // undefined = apenas abre dropdown
  icon: LucideIcon;
  children?: SidebarNavChild[];
}

interface SidebarNavChild {
  label: string;
  href: string;
  badge?: number;
  disabled?: boolean;
  section?: string;        // agrupamento visual dentro do dropdown
}
```

### Regra de Auto-Abertura

```typescript
// Abrir o grupo cujo href é prefixo da rota atual
const isGroupActive = (item: SidebarNavItem, pathname: string): boolean => {
  if (!item.children) return false;
  return pathname.startsWith(item.href ?? '') ||
    item.children.some(child => pathname.startsWith(child.href));
};

// No mount e na mudança de rota, verificar e abrir o grupo ativo
useEffect(() => {
  const activeGroup = navItems.find(item => isGroupActive(item, pathname));
  if (activeGroup) {
    setOpenGroups(prev => new Set([...prev, activeGroup.key]));
  }
}, [pathname]);
```

---

## Mapa de Migração: Sub-Sidebars → Dropdown Items

### Contatos
**Origem:** `components/contacts/contacts-sub-sidebar.tsx`

```
Seção "Principal"
  → Todos os Contatos   /contatos
  → Listas              /contatos/listas

Seção "Gerenciar"
  → Segmentos           /contatos/segmentos
  → Tags                /contatos/tags
  → Campos              /contatos/campos

Seção "Dados"
  → Importar            /contatos/importar
  → Exportar            /contatos/exportar
  → Lixeira             /contatos/lixeira

Seção "Relatórios"
  → Tendências          /contatos/tendencias
  → Desempenho          /contatos/desempenho
```

### Conversas
**Origem:** `components/conversations/chat-sub-sidebar.tsx`

```
Seção "Principal"
  → Todas as Conversas  /conversas
  → Menções             /conversas/mencoes
  → Não Atendidas       /conversas/nao-atendidas

Seção "Pastas"
  → Prioridade          /conversas/pastas/prioridade   (badge: 3)
  → Leads Inbox         /conversas/pastas/leads        (badge: 12)

Seção "Equipes"
  → Vendas              /conversas/equipes/vendas
  → Suporte L1          /conversas/equipes/suporte

Seção "Canais"
  → WhatsApp            /conversas/canais/whatsapp
  → Instagram           /conversas/canais/instagram
  → Chat Widget         /conversas/canais/widget
```

### Agendamentos
**Origem:** `components/agenda/agenda-sub-sidebar.tsx`

```
Seção "Principal"
  → Visão Geral         /agendamentos
  → Concluídas          /agendamentos/concluidas

Seção "Tipos"
  → Ligações            /agendamentos/ligacoes        (badge: 3)
  → Reuniões            /agendamentos/reunioes        (badge: 5)
  → Tarefas             /agendamentos/tarefas         (badge: 4)
  → Prazos              /agendamentos/prazos          (badge: 1)
```

### Cobranças
**Origem:** `components/cobrancas/cobrancas-sub-sidebar.tsx`

```
Seção "Principal"
  → Visão Geral         /cobrancas
  → Assinaturas         /cobrancas/assinaturas
  → Faturas             /cobrancas/faturas
  → Clientes            /cobrancas/clientes

Seção "Gestão"
  → Métodos             /cobrancas/metodos
  → Histórico           /cobrancas/historico
  → Reembolsos          /cobrancas/reembolsos
  → Descontos           /cobrancas/descontos

Seção "Configurações"
  → Planos e Preços     /cobrancas/planos
  → Taxas e Impostos    /cobrancas/taxas
  → Configurações       /cobrancas/configuracoes
```

### Integrações
**Origem:** `components/integrations/integrations-sub-sidebar.tsx` + `components/whatsapp/whatsapp-sub-sidebar.tsx`

```
Seção "Canais"
  → WhatsApp Oficial    /integracoes/whatsapp
  → WhatsApp Não Oficial /integracoes/whatsapp-unofficial
  → Instagram           /integracoes/instagram
  → Compliance          /integracoes/compliance
  → Config WPP          /integracoes/config-wpp

Seção "Ações"
  → Webhooks            /integracoes/webhooks
  → Histórico de Logs   /integracoes/logs
  → Sincronização       /integracoes/sync
  → Filtros             /integracoes/filtros

Seção "Configurações"
  → Configurações       /integracoes/configuracoes
  → Token Auth          /integracoes/token
  → Exportar Logs       /integracoes/exportar-logs
```

---

## Checklist de Implementação

> **Regra de build:** Após cada função marcada, executar `npm run build` e verificar
> que não há erros. Só avançar para a próxima função após build verde.

---

### FASE 1 — Sidebar Fixa (Remove Collapse)
**Agente:** `@dev`

#### F1.1 — Remover estado de colapso do hook
- [ ] Abrir `hooks/use-main-sidebar.ts`
- [ ] Remover estado `collapsed`, setter e lógica de localStorage
- [ ] Exportar apenas o necessário (ou deletar o arquivo se não houver mais uso)
- [ ] **BUILD CHECK:** `npm run build` → deve passar sem erros de import

#### F1.2 — Fixar sidebar em 160px
- [ ] Abrir `components/sidebar.tsx`
- [ ] Remover classes condicionais de width (`w-10` / `w-40`)
- [ ] Aplicar `w-40` (160px) fixo no container raiz
- [ ] Remover o botão de toggle (chevron / hamburger) da sidebar
- [ ] Remover variações de UI: icon-only mode, tooltips de estado colapsado
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F1.3 — Remover dependências de sidebarWidth dinâmico
- [ ] Buscar todos os usos de `sidebarWidth`, `useSidebarWidth`, `isCollapsed` no codebase
- [ ] Substituir por valor fixo `160` onde necessário
- [ ] Remover exports não utilizados do contexto
- [ ] **BUILD CHECK:** `npm run build` → deve passar

---

### FASE 2 — Componente SidebarDropdownGroup (@architect → @dev)

#### F2.1 — Criar interfaces TypeScript
- [ ] Criar arquivo `components/sidebar-nav-config.ts`
- [ ] Definir interfaces `SidebarNavItem` e `SidebarNavChild` conforme arquitetura
- [ ] Definir função `isGroupActive(item, pathname): boolean`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F2.2 — Criar componente SidebarDropdownGroup
- [ ] Criar arquivo `components/sidebar-dropdown-group.tsx`
- [ ] Componente recebe: `item: SidebarNavItem`, `isOpen: boolean`, `onToggle: () => void`, `pathname: string`
- [ ] Renderizar header do grupo com ícone + label + chevron animado
- [ ] Renderizar sub-itens com animação accordion (max-height transition)
- [ ] Sub-itens com badge numérico quando `child.badge` definido
- [ ] Sub-itens desabilitados quando `child.disabled = true`
- [ ] Separadores visuais entre seções (`child.section` diferente do anterior)
- [ ] Highlight ativo: sub-item com `pathname === child.href` recebe fundo destacado
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F2.3 — Criar hook useSidebarDropdowns
- [ ] Criar arquivo `hooks/use-sidebar-dropdowns.ts`
- [ ] Estado: `openGroups: Set<string>`
- [ ] Ações: `toggleGroup(key)`, `openGroup(key)`, `closeGroup(key)`
- [ ] Efeito: ao mudar pathname, auto-abrir o grupo cujo children inclui a rota ativa
- [ ] **BUILD CHECK:** `npm run build` → deve passar

---

### FASE 3 — Migrar Nav Items para Config com Dropdowns (@dev)

#### F3.1 — Criar arquivo de configuração de nav
- [ ] Criar (ou adaptar) `components/sidebar-nav-config.ts`
- [ ] Definir `topNavItems: SidebarNavItem[]` com todos os grupos e seus children
  - Overview (sem dropdown)
  - Contatos (com dropdown: todos os items da sub-sidebar)
  - Conversas (com dropdown)
  - Pipeline (sem dropdown)
  - Agendamentos (com dropdown)
  - Integrações (com dropdown — unificando integrations + whatsapp sub-sidebars)
  - Cobranças (com dropdown)
- [ ] Definir `bottomNavItems: SidebarNavItem[]`
  - Loja (sem dropdown)
  - Configurações (sem dropdown ou com dropdown se necessário)
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F3.2 — Integrar dropdowns no sidebar.tsx
- [ ] Abrir `components/sidebar.tsx`
- [ ] Importar `useSidebarDropdowns` e `SidebarDropdownGroup`
- [ ] Substituir renderização de itens simples pelo novo padrão:
  - Item sem children → renderiza link simples (comportamento atual)
  - Item com children → renderiza `SidebarDropdownGroup`
- [ ] Usar `topNavItems` e `bottomNavItems` do config
- [ ] **BUILD CHECK:** `npm run build` → deve passar

---

### FASE 4 — Remoção das Sub-Sidebars (@dev)

> Remover um por um para facilitar rollback se necessário.

#### F4.1 — Remover AgendaSubSidebar
- [ ] Abrir `app/agendamentos/layout.tsx`
- [ ] Remover import e uso de `AgendaSubSidebar`
- [ ] Ajustar grid/flex do layout (remover coluna da sub-sidebar)
- [ ] **BUILD CHECK:** `npm run build` → deve passar
- [ ] Deletar `components/agenda/agenda-sub-sidebar.tsx`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F4.2 — Remover CobrancasSubSidebar
- [ ] Abrir `app/cobrancas/layout.tsx`
- [ ] Remover import e uso de `CobrancasSubSidebar`
- [ ] Ajustar grid/flex do layout
- [ ] **BUILD CHECK:** `npm run build` → deve passar
- [ ] Deletar `components/cobrancas/cobrancas-sub-sidebar.tsx`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F4.3 — Remover IntegrationsSubSidebar e WhatsAppSubSidebar
- [ ] Abrir `app/integracoes/(with-sidebar)/layout.tsx`
- [ ] Remover import e uso de `IntegrationsSubSidebar`
- [ ] Abrir `app/integracoes/(whatsapp-routes)/layout.tsx`
- [ ] Remover import e uso de `IntegrationsSubSidebar`
- [ ] Abrir `app/integracoes/(whatsapp)/layout.tsx`
- [ ] Remover import e uso de `WhatsAppSubSidebar`
- [ ] Ajustar grids dos três layouts
- [ ] **BUILD CHECK:** `npm run build` → deve passar
- [ ] Deletar `components/integrations/integrations-sub-sidebar.tsx`
- [ ] Deletar `components/whatsapp/whatsapp-sub-sidebar.tsx`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F4.4 — Remover ContactsSubSidebar
- [ ] Localizar onde `contacts-sub-sidebar.tsx` é renderizado (layout de contatos)
- [ ] Remover import e uso
- [ ] Ajustar layout
- [ ] **BUILD CHECK:** `npm run build` → deve passar
- [ ] Deletar `components/contacts/contacts-sub-sidebar.tsx`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F4.5 — Remover ChatSubSidebar
- [ ] Localizar onde `chat-sub-sidebar.tsx` é renderizado (layout de conversas)
- [ ] Remover import e uso
- [ ] Ajustar layout (era 4 colunas — conversas tem layout especial)
- [ ] **BUILD CHECK:** `npm run build` → deve passar
- [ ] Deletar `components/conversations/chat-sub-sidebar.tsx`
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F4.6 — Remover ContextualSubSidebar e AISubSidebar
- [ ] Verificar se `contextual-sub-sidebar.tsx` tem outros usos além do dashboard
- [ ] Verificar se `ai-sub-sidebar.tsx` tem outros usos
- [ ] Se não tiver outros usos: remover imports e deletar arquivos
- [ ] Se tiver outros usos: manter e documentar aqui
- [ ] **BUILD CHECK:** `npm run build` → deve passar

---

### FASE 5 — Limpeza de Contexto e Hooks (@dev)

#### F5.1 — Simplificar sidebar-context.tsx
- [ ] Abrir `lib/contexts/sidebar-context.tsx`
- [ ] Remover estados relacionados a sub-sidebar: `activeNavItem`, `isOpen`, `sidebarWidth`, `isAnimating`, `sidebarMounted`
- [ ] Manter apenas o que for ainda necessário (verificar outros consumidores)
- [ ] Se o contexto ficar vazio, deletar arquivo e remover `SubSidebarProvider` do root layout
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F5.2 — Remover hooks obsoletos
- [ ] Deletar `hooks/use-contacts-sidebar.ts` (não haverá mais ContactsSubSidebar)
- [ ] Deletar `hooks/use-main-sidebar.ts` se já não for usado após F1.1
- [ ] Buscar qualquer outro import residual dos hooks deletados
- [ ] **BUILD CHECK:** `npm run build` → deve passar

#### F5.3 — Limpeza de imports e dead code
- [ ] Rodar `npm run lint` e corrigir todos os warnings de imports não utilizados
- [ ] Verificar se há referências a `SubSidebarProvider` no `app/layout.tsx` e remover
- [ ] **BUILD CHECK:** `npm run build && npm run lint` → ambos devem passar

---

### FASE 6 — QA e Validação Final (@qa)

#### F6.1 — Validação de build e tipos
- [ ] `npm run build` — zero erros
- [ ] `npm run lint` — zero warnings relevantes
- [ ] `npm run typecheck` (se disponível) — zero erros de tipo

#### F6.2 — Validação visual da sidebar
- [ ] Sidebar aparece sempre em 160px (medir no DevTools)
- [ ] Nenhum botão de colapso visível
- [ ] Todos os itens com dropdown exibem o ícone chevron
- [ ] Chevron anima corretamente ao abrir/fechar

#### F6.3 — Validação de auto-abertura
- [ ] Navegar para `/contatos` → grupo Contatos abre automaticamente
- [ ] Navegar para `/agendamentos/ligacoes` → grupo Agendamentos abre automaticamente
- [ ] Navegar para `/integracoes/whatsapp` → grupo Integrações abre automaticamente
- [ ] Navegar para `/cobrancas/faturas` → grupo Cobranças abre automaticamente
- [ ] Navegar para `/conversas/mencoes` → grupo Conversas abre automaticamente
- [ ] Navegar para `/pipeline` → nenhum dropdown abre (item simples)

#### F6.4 — Validação de navegação
- [ ] Cada sub-item navega para a rota correta
- [ ] Sub-item ativo recebe highlight visual
- [ ] Badges numéricos aparecem corretamente onde definidos
- [ ] Itens desabilitados não são clicáveis

#### F6.5 — Validação de layouts por rota
- [ ] `/` (Overview) — layout sem sub-sidebar, conteúdo ocupa espaço corretamente
- [ ] `/conversas` — layout de 4 colunas sem ChatSubSidebar; lista de conversas ainda funciona
- [ ] `/contatos` — sem ContactsSubSidebar; tabela de contatos ocupa espaço correto
- [ ] `/agendamentos` — sem AgendaSubSidebar; conteúdo centralizado
- [ ] `/cobrancas` — sem CobrancasSubSidebar; conteúdo centralizado
- [ ] `/integracoes` — sem sub-sidebars; conteúdo centralizado
- [ ] `/pipeline` — sem alterações visuais (não tinha sub-sidebar)

#### F6.6 — Validação de ausência de erros
- [ ] Console do browser sem erros ao navegar por todas as rotas
- [ ] Sem warnings de React (hooks, keys, etc.)
- [ ] Network tab sem 404s de assets

---

## Ordem de Execução por Agente

```
@architect
  └── Revisar e aprovar arquitetura do componente (F2.1)

@dev
  ├── FASE 1: Sidebar Fixa (F1.1 → F1.2 → F1.3)
  ├── FASE 2: Componente Dropdown (F2.1 → F2.2 → F2.3)
  ├── FASE 3: Nav Config (F3.1 → F3.2)
  ├── FASE 4: Remoção Sub-Sidebars (F4.1 → F4.2 → F4.3 → F4.4 → F4.5 → F4.6)
  └── FASE 5: Limpeza (F5.1 → F5.2 → F5.3)

@qa
  └── FASE 6: Validação Final (F6.1 → F6.2 → F6.3 → F6.4 → F6.5 → F6.6)
```

---

## Arquivos a Criar

| Arquivo | Responsável | Fase |
|---------|-------------|------|
| `components/sidebar-nav-config.ts` | @dev | F3.1 |
| `components/sidebar-dropdown-group.tsx` | @dev | F2.2 |
| `hooks/use-sidebar-dropdowns.ts` | @dev | F2.3 |

## Arquivos a Modificar

| Arquivo | Mudança | Fase |
|---------|---------|------|
| `components/sidebar.tsx` | Remover colapso, integrar dropdowns | F1.2, F3.2 |
| `hooks/use-main-sidebar.ts` | Remover ou simplificar | F1.1 |
| `lib/contexts/sidebar-context.tsx` | Remover estados de sub-sidebar | F5.1 |
| `app/layout.tsx` | Remover SubSidebarProvider | F5.1 |
| `app/agendamentos/layout.tsx` | Remover AgendaSubSidebar | F4.1 |
| `app/cobrancas/layout.tsx` | Remover CobrancasSubSidebar | F4.2 |
| `app/integracoes/(with-sidebar)/layout.tsx` | Remover IntegrationsSubSidebar | F4.3 |
| `app/integracoes/(whatsapp-routes)/layout.tsx` | Remover IntegrationsSubSidebar | F4.3 |
| `app/integracoes/(whatsapp)/layout.tsx` | Remover WhatsAppSubSidebar | F4.3 |

## Arquivos a Deletar

| Arquivo | Fase |
|---------|------|
| `components/agenda/agenda-sub-sidebar.tsx` | F4.1 |
| `components/cobrancas/cobrancas-sub-sidebar.tsx` | F4.2 |
| `components/integrations/integrations-sub-sidebar.tsx` | F4.3 |
| `components/whatsapp/whatsapp-sub-sidebar.tsx` | F4.3 |
| `components/contacts/contacts-sub-sidebar.tsx` | F4.4 |
| `components/conversations/chat-sub-sidebar.tsx` | F4.5 |
| `components/contextual-sub-sidebar.tsx` | F4.6 (condicional) |
| `components/ai-sub-sidebar.tsx` | F4.6 (condicional) |
| `hooks/use-contacts-sidebar.ts` | F5.2 |

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Conversas perdendo funcionalidade ao remover ChatSubSidebar | A lista de conversas é renderizada separada da sub-sidebar — verificar layout em F4.5 antes de deletar |
| Rotas de integrações com 3 layout groups diferentes | Remover os 3 em F4.3 sequencialmente com build check entre cada um |
| Sidebar context usado por outros componentes | Auditar todos os consumidores em F5.1 antes de deletar |
| Sub-items sem rota implementada | Manter `href` definido; destinos sem página exibem 404 aceitável neste ciclo |
| Width fixo quebrando layouts responsivos | Auditar todos os layouts que usavam `sidebarWidth` dinâmico em F1.3 |

---

## Notas de Design

- Usar `transition-all duration-200` para animação do accordion
- Chevron: `rotate-0` fechado → `rotate-180` aberto
- Sub-itens: padding-left de 12px para indentação visual dentro da sidebar roxa
- Seções dentro do dropdown: separador visual sutil (border-t opacity-20) + label de seção em uppercase xs
- Badge: pill roxo mais claro sobre fundo da sidebar
- Item ativo: fundo `bg-white/20` + texto branco bold no sub-item
