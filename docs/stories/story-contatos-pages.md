# Story: Implementação das Páginas Faltantes — Módulo CONTATOS

**ID:** STORY-CONTATOS-001
**Módulo:** `/contatos`
**Status:** 🟡 Planejado
**Data:** 2026-03-05
**Projeto:** NexIA Chat — CRM Dashboard
**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Radix UI · shadcn/ui

---

## Contexto

O módulo **CONTATOS** possui duas páginas implementadas (`/contatos` e `/contatos/tags`) e um sub-sidebar com navegação para **8 rotas adicionais** que não possuem arquivo `page.tsx`. Todas essas rotas estão listadas no componente `ContactsSubSidebar` e levam a páginas 404.

### Páginas Existentes ✅
- `/contatos` — Listagem principal (tabela + filtros + painel de detalhe)
- `/contatos/tags` — CRUD de tags com cor, lead score e UTM

### Páginas Faltantes ❌
| Rota | Seção no Sidebar | Prioridade |
|------|-----------------|-----------|
| `/contatos/novo` | — | Alta |
| `/contatos/listas` | Principal | Alta |
| `/contatos/segmentos` | Gerenciar | Alta |
| `/contatos/campos` | Gerenciar | Média |
| `/contatos/pontuacao` | Gerenciar | Média |
| `/contatos/importar` | Dados | Alta |
| `/contatos/exportar` | Dados | Média |
| `/contatos/lixeira` | Dados | Média |
| `/contatos/relatorios/tendencias` | (oculto no sidebar) | Baixa |
| `/contatos/relatorios/desempenho` | (oculto no sidebar) | Baixa |

---

## Padrão de Implementação (a seguir em TODAS as páginas)

### Layout padrão
```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  <div className="flex-shrink-0">
    <ContactsSubSidebar />
  </div>
  <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 min-w-0">
    {/* conteúdo da página */}
  </main>
</div>
```

### Cores do Design System
- Primary: `#9795e4` (violeta)
- Hover: `#7c7ab8`
- Light: `#9795e4/10` (fundo de seleção)
- Muted text: `text-muted-foreground`
- Border: `border-border`

### Estrutura de arquivo
```
app/contatos/{rota}/page.tsx
```
- `"use client"` no topo
- Dados mock importados de `@/lib/mock/`
- Componentes UI de `@/components/ui/`
- Ícones de `lucide-react`

---

## FASE 1 — Alta Prioridade (Implementar primeiro)

### 1.1 · `/contatos/novo` — Formulário de Novo Contato

**Descrição:** Página dedicada para criação de um novo contato com formulário completo.

**Acceptance Criteria:**
- [ ] Layout padrão (Sidebar + ContactsSubSidebar + main)
- [ ] Formulário com todos os campos do `Contact` interface:
  - Nome, Sobrenome (obrigatórios)
  - Email, Telefone (obrigatórios)
  - Cidade, Estado
  - Cargo, Empresa
  - Instagram, LinkedIn
  - Tags (multiselect com as tags existentes do MOCK_TAGS)
  - Status (select: ativo/inativo/pendente/convertido)
  - Origem (text)
  - UTM Source, Medium, Campaign
  - Observações (textarea)
- [ ] Validação com React Hook Form + Zod
- [ ] Botão "Salvar Contato" com cor `#9795e4`
- [ ] Botão "Cancelar" que redireciona para `/contatos`
- [ ] Header com título "Novo Contato" e breadcrumb
- [ ] Geração automática de avatar (iniciais) e avatarBg (cor aleatória)

**Arquivos a criar:**
```
app/contatos/novo/page.tsx
```

**Dados mock necessários:** Usar `MOCK_TAGS` para seleção de tags.

---

### 1.2 · `/contatos/listas` — Gerenciamento de Listas

**Descrição:** Listas são agrupamentos estáticos e nomeados de contatos, criados manualmente. Diferente de segmentos (dinâmicos), listas são fixas.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header com título "Listas", contagem e botão "Criar Lista"
- [ ] Tabela com colunas: Nome, Descrição, Qtd. Contatos, Criado em, Ações
- [ ] Barra de busca por nome
- [ ] Dialog para criar/editar lista:
  - Nome (obrigatório)
  - Descrição
  - Cor (picker igual ao de tags)
- [ ] Ação de excluir com confirmação
- [ ] Estado vazio com ilustração e CTA
- [ ] Cards de estatísticas no topo: Total de Listas, Total de Contatos em Listas, Maior Lista

**Arquivos a criar:**
```
app/contatos/listas/page.tsx
lib/mock/lists.ts
```

**Mock data a criar em `lib/mock/lists.ts`:**
```typescript
export interface ContactList {
  id: string
  nome: string
  descricao?: string
  cor: string
  contatosCount: number
  contatosIds: string[]
  criadoEm: string
  atualizadoEm: string
  criadoPor: string
}
```

---

### 1.3 · `/contatos/segmentos` — Segmentação Dinâmica

**Descrição:** Segmentos são grupos dinâmicos baseados em regras/filtros aplicados automaticamente. Quando um contato passa a satisfazer as regras, entra automaticamente no segmento.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header com título "Segmentos", contagem e botão "Criar Segmento"
- [ ] Cards/grid de segmentos (não tabela) com:
  - Nome e descrição
  - Cor do segmento
  - Contador de contatos que satisfazem as regras
  - Preview das regras (ex: "Status = Ativo E Lead Score > 70")
  - Ações: Editar, Ver Contatos, Excluir
- [ ] Dialog para criar/editar segmento:
  - Nome, Descrição, Cor
  - Builder de regras (condição AND/OR entre regras)
  - Cada regra: Campo (status, leadScore, origem, tags, cidade, estado) + Operador + Valor
  - Preview em tempo real da contagem de contatos que satisfazem
- [ ] Filtrar/buscar segmentos
- [ ] Indicador de "Atualizado há X tempo"

**Arquivos a criar:**
```
app/contatos/segmentos/page.tsx
lib/mock/segments.ts
```

**Mock data a criar em `lib/mock/segments.ts`:**
```typescript
export type RuleOperator = "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in"
export type RuleField = "status" | "leadScore" | "origem" | "tags" | "cidade" | "estado" | "empresa"

export interface SegmentRule {
  field: RuleField
  operator: RuleOperator
  value: string | number | string[]
}

export interface Segment {
  id: string
  nome: string
  descricao?: string
  cor: string
  regras: SegmentRule[]
  operador: "AND" | "OR"
  contatosCount: number
  criadoEm: string
  atualizadoEm: string
}
```

---

### 1.4 · `/contatos/importar` — Importação em Massa

**Descrição:** Interface para importar contatos via CSV ou Excel com mapeamento de colunas e validação antes de salvar.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header com título "Importar Contatos" e botão "Baixar template CSV"
- [ ] **Passo 1 — Upload:**
  - Zona de drag-and-drop para arquivo CSV/XLSX
  - Ou botão "Selecionar arquivo"
  - Exibe nome e tamanho do arquivo selecionado
  - Formato suportado: `.csv`, `.xlsx`
- [ ] **Passo 2 — Mapeamento de colunas:**
  - Exibe primeiras 3 linhas do arquivo como preview
  - Para cada coluna do arquivo: dropdown para mapear ao campo do Contact
  - Campos obrigatórios marcados (nome, email)
  - Aviso para colunas não mapeadas
- [ ] **Passo 3 — Preview & Validação:**
  - Tabela com os primeiros 10 registros que serão importados
  - Contagem: total, válidos, com erros
  - Lista de erros por linha (email inválido, campos obrigatórios faltando, etc.)
- [ ] **Passo 4 — Resultado:**
  - Barra de progresso simulada
  - Resumo final: X importados, Y com erro
  - Botão "Ver Contatos Importados" e "Importar Outro Arquivo"
- [ ] Stepper visual no topo (Passo 1 de 4)

**Arquivos a criar:**
```
app/contatos/importar/page.tsx
```

---

## FASE 2 — Prioridade Média

### 2.1 · `/contatos/campos` — Campos Personalizados

**Descrição:** Gerenciamento de campos customizados além dos campos padrão do Contact. Permite criar campos extras para armazenar dados específicos do negócio.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header com título "Campos Personalizados" e botão "Criar Campo"
- [ ] Seção "Campos Padrão" (somente leitura):
  - Lista dos campos default do Contact (nome, email, telefone, etc.) com tipo e descrição
  - Badge "Padrão" em cada campo
  - Não podem ser editados nem excluídos
- [ ] Seção "Campos Personalizados":
  - Tabela: Nome, Tipo, Obrigatório, Criado em, Ações (editar/excluir)
  - Drag-and-drop para reordenar (visual apenas)
- [ ] Dialog criar/editar campo:
  - Nome interno (slug sem espaços)
  - Label de exibição
  - Tipo: `texto`, `número`, `data`, `seleção`, `booleano`, `url`
  - Se tipo = "seleção": campo para adicionar opções
  - Campo obrigatório (toggle)
  - Descrição/help text
- [ ] Preview de como o campo apareceria no formulário de contato

**Arquivos a criar:**
```
app/contatos/campos/page.tsx
lib/mock/custom-fields.ts
```

**Mock data:**
```typescript
export type FieldType = "texto" | "numero" | "data" | "selecao" | "booleano" | "url"

export interface CustomField {
  id: string
  nome: string           // slug: "preferencia_contato"
  label: string          // display: "Preferência de Contato"
  tipo: FieldType
  obrigatorio: boolean
  opcoes?: string[]      // para tipo "selecao"
  descricao?: string
  ordem: number
  criadoEm: string
}

// Campos padrão (readonly)
export const DEFAULT_FIELDS = [
  { nome: "nome", label: "Nome", tipo: "texto", obrigatorio: true },
  { nome: "sobrenome", label: "Sobrenome", tipo: "texto", obrigatorio: true },
  { nome: "email", label: "E-mail", tipo: "texto", obrigatorio: true },
  // ... etc
]
```

---

### 2.2 · `/contatos/pontuacao` — Regras de Lead Scoring

**Descrição:** Configure as regras que definem automaticamente a pontuação (leadScore) dos contatos. Cada ação ou atributo pode adicionar ou subtrair pontos.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header "Pontuação de Leads" com botão "Criar Regra"
- [ ] Cards de resumo no topo:
  - Contatos com score alto (≥70): contagem
  - Contatos com score médio (40–69): contagem
  - Contatos com score baixo (<40): contagem
  - Score médio geral
- [ ] Barra de classificação visual: Hot (≥70), Warm (40–69), Cold (<40)
- [ ] Tabela de regras de pontuação:
  - Evento/Atributo, Pontos (+/-), Ativo/Inativo, Ações
- [ ] Dialog criar/editar regra:
  - Categoria: Perfil, Engajamento, Conversão
  - Evento: (baseado na categoria)
  - Pontos: input numérico com sinal +/-
  - Ativo (toggle)
  - Descrição
- [ ] Configuração de thresholds (Hot/Warm/Cold) com sliders
- [ ] Botão "Recalcular Scores" com feedback visual

**Arquivos a criar:**
```
app/contatos/pontuacao/page.tsx
lib/mock/scoring-rules.ts
```

**Mock data:**
```typescript
export interface ScoringRule {
  id: string
  categoria: "perfil" | "engajamento" | "conversao"
  evento: string
  pontos: number   // positivo ou negativo
  ativo: boolean
  descricao?: string
}

export interface ScoringThresholds {
  hot: number    // default: 70
  warm: number   // default: 40
}
```

---

### 2.3 · `/contatos/exportar` — Exportação de Contatos

**Descrição:** Interface para exportar contatos filtrados com seleção de campos e formato.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header "Exportar Contatos"
- [ ] **Seção 1 — Filtros de Contatos:**
  - Status, Tags, Origem (múltipla seleção)
  - Range de data de criação
  - Lead score mínimo/máximo
  - Preview da contagem: "X contatos selecionados"
- [ ] **Seção 2 — Campos para exportar:**
  - Checkboxes para cada campo do Contact
  - "Selecionar todos" / "Limpar seleção"
  - Preview das colunas selecionadas
- [ ] **Seção 3 — Formato:**
  - CSV (padrão) ou Excel (XLSX)
  - Separador (vírgula, ponto-e-vírgula)
- [ ] Botão "Exportar" proeminente com cor primária
- [ ] Histórico das últimas exportações (tabela com data, filtros usados, qtd exportada)

**Arquivos a criar:**
```
app/contatos/exportar/page.tsx
```

---

### 2.4 · `/contatos/lixeira` — Contatos Excluídos

**Descrição:** Listagem dos contatos marcados como excluídos, com opção de restaurar ou excluir permanentemente.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Header "Lixeira" com contagem e botão "Esvaziar Lixeira" (destrutivo, vermelho)
- [ ] Banner de aviso: "Contatos são excluídos permanentemente após 30 dias"
- [ ] Tabela com colunas: Contato (avatar + nome), Email, Excluído em, Excluído por, Ações
- [ ] Ações por linha: Restaurar, Excluir Permanentemente
- [ ] Seleção múltipla com bulk actions: Restaurar selecionados, Excluir permanentemente
- [ ] Busca por nome/email
- [ ] Estado vazio: "Lixeira vazia" com ícone
- [ ] Badge no sidebar com contagem de itens (badge: 0 → badge: N)
- [ ] Contador de dias restantes antes da exclusão permanente

**Arquivos a criar:**
```
app/contatos/lixeira/page.tsx
lib/mock/trash.ts
```

**Mock data:**
```typescript
export interface TrashedContact extends Contact {
  excluidoEm: string
  excluidoPor: string
  expiracaoEm: string   // data de exclusão permanente automática
}
```

---

## FASE 3 — Prioridade Baixa (Relatórios — ativar no sidebar)

> **Nota:** A seção "Relatórios" está comentada no `ContactsSubSidebar`. Para estas páginas, deve-se reativar a seção removendo os comentários.

### 3.1 · `/contatos/relatorios/tendencias` — Tendências de Contatos

**Descrição:** Dashboard de tendências: crescimento da base, engajamento ao longo do tempo, top origens.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Reativar seção Relatórios no `ContactsSubSidebar`
- [ ] Cards KPI no topo:
  - Novos contatos (mês atual vs anterior)
  - Taxa de crescimento
  - Contatos ativos vs inativos
  - Score médio
- [ ] Gráfico de linha: "Novos contatos por mês" (usar Recharts, já no projeto)
- [ ] Gráfico de barra: "Origens de contatos" (top 5)
- [ ] Gráfico de pizza: "Distribuição por status"
- [ ] Tabela de top tags (mais usadas)
- [ ] Filtro de período: últimos 7d / 30d / 90d / 12m

**Arquivos a criar:**
```
app/contatos/relatorios/tendencias/page.tsx
```

---

### 3.2 · `/contatos/relatorios/desempenho` — Desempenho de Contatos

**Descrição:** Análise de desempenho: conversão, engajamento por tag, progresso de leads no funil.

**Acceptance Criteria:**
- [ ] Layout padrão
- [ ] Cards KPI:
  - Taxa de conversão (pendente → convertido)
  - Taxa de inatividade
  - Leads "Hot" (score ≥70)
  - Tempo médio de conversão
- [ ] Gráfico de funil: pendente → ativo → convertido
- [ ] Tabela de desempenho por tag: tag, contatos, score médio, taxa conversão
- [ ] Gráfico de dispersão: score vs engajamento
- [ ] Exportar relatório (PDF simulado)
- [ ] Filtro de período

**Arquivos a criar:**
```
app/contatos/relatorios/desempenho/page.tsx
```

---

## Ordem de Implementação Recomendada

```
Sprint 1 (Fase 1 - Alta Prioridade)
├── [1] /contatos/novo        → Formulário de criação
├── [2] /contatos/listas      → CRUD de listas + mock
├── [3] /contatos/segmentos   → Segmentação dinâmica + mock
└── [4] /contatos/importar    → Wizard de importação

Sprint 2 (Fase 2 - Prioridade Média)
├── [5] /contatos/campos      → Campos personalizados + mock
├── [6] /contatos/pontuacao   → Regras de scoring + mock
├── [7] /contatos/exportar    → Export com filtros
└── [8] /contatos/lixeira     → Trash + mock + ativar badge sidebar

Sprint 3 (Fase 3 - Baixa Prioridade)
├── [9]  Reativar seção Relatórios no ContactsSubSidebar
├── [10] /contatos/relatorios/tendencias
└── [11] /contatos/relatorios/desempenho
```

---

## Arquivos que serão criados

```
app/
  contatos/
    novo/page.tsx
    listas/page.tsx
    segmentos/page.tsx
    campos/page.tsx
    pontuacao/page.tsx
    importar/page.tsx
    exportar/page.tsx
    lixeira/page.tsx
    relatorios/
      tendencias/page.tsx
      desempenho/page.tsx

lib/mock/
  lists.ts
  segments.ts
  custom-fields.ts
  scoring-rules.ts
  trash.ts
```

## Arquivos que serão modificados

```
components/contacts/contacts-sub-sidebar.tsx
  → Reativar seção Relatórios (Sprint 3)
  → Atualizar badge da lixeira com contagem real
```

---

## Dependências & Notas Técnicas

- **Recharts** já está instalado — usar para todos os gráficos
- **React Hook Form + Zod** já instalados — usar em formulários de criação
- **Radix UI Dialog** — usar para todos os modais de criação/edição
- **Radix UI Tabs** — útil na página de importar (stepper alternativo)
- **Lucide React** — ícones disponíveis
- Nenhuma dependência nova deve ser necessária
- Não há backend real — todas as operações são apenas no estado React (mock)
- O badge da lixeira no sidebar usa `badge: 0` — atualizar para refletir mock

---

*Documento criado em 2026-03-05 | Synkra AIOS*
