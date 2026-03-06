# Plano de Execução — Botões da Dashboard Home
# NexIA Chat · Next.js 15 · TypeScript · Tailwind · shadcn/ui
# Sistema: Synkra AIOS · Agents: @architect, @dev, @qa

**Data:** 2026-03-05  
**Escopo:** Implementar funcionalidades dos 5 botões do Dashboard Header  
**Arquivo alvo:** `components/dashboard-header.tsx`

---

## Visão Geral

Os botões do header da dashboard estão apenas visuais (mock) e precisam ser implementados:

| Botão | Funcionalidade Esperada | Complexidade |
|-------|------------------------|--------------|
| **Período** | Filtro de data que atualiza todos os gráficos/KPIs | Média |
| **Usuários** | Filtro por usuário/agente | Média |
| **Exportar** | Exportação PDF/Excel/CSV da dashboard | Alta |
| **Alertas** | Sistema de notificações com dropdown | Média |
| **Novo Lead** | Modal/dialog para criar lead rápido | Média |

---

## Arquitetura Proposta — AIOS Agent Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD CONTEXT                            │
│  (React Context Provider - estado global dos filtros)          │
├─────────────────────────────────────────────────────────────────┤
│  • dateRange: { start: Date, end: Date, label: string }        │
│  • selectedUsers: string[]                                      │
│  • refreshTrigger: number (para forçar re-fetch dos dados)     │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────────┐
   │ Period  │          │ Users   │          │   Charts    │
   │Selector │          │ Filter  │          │   & KPIs    │
   └────┬────┘          └────┬────┘          └──────┬──────┘
        │                    │                      │
        └────────────────────┴──────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Export     │
                    │  Generator  │
                    └─────────────┘
```

---

## FASE 1 — Fundação (Contexto Global)

### Bloco 1.1 — Criar DashboardContext
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Nenhuma

```
AGENTE: @dev
SKILL: coding-guidelines

Você é um desenvolvedor especialista em React e Next.js.

=== CONTEXTO ===
Projeto: NexIA Chat - CRM Dashboard
Stack: Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui

=== TAREFA ===
Crie o arquivo: hooks/use-dashboard-context.tsx

Este é um React Context para gerenciar estado global dos filtros da dashboard.

REQUISITOS:

1. Tipos a definir:
   type DateRange = {
     label: string
     startDate: Date
     endDate: Date
   }
   
   type DashboardContextType = {
     // Filtro de período
     dateRange: DateRange
     setDateRange: (range: DateRange) => void
     
     // Filtro de usuários
     selectedUsers: string[]
     toggleUser: (userId: string) => void
     setSelectedUsers: (users: string[]) => void
     
     // Trigger para refresh de dados
     refreshTrigger: number
     refresh: () => void
   }

2. Opções pré-definidas de período:
   - last7days: Últimos 7 dias
   - last30days: Últimos 30 dias  
   - thisMonth: Este mês
   - lastMonth: Mês passado
   - custom: Personalizado (preparar estrutura, não implementar UI ainda)

3. Implementar helper getDefaultDateRange() que retorna "last7days" como padrão

4. Provider deve envolver a aplicação (será usado em app/page.tsx)

5. Exportar hook useDashboard() para consumir o contexto

ESTRUTURA DO ARQUIVO:
```tsx
"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// Tipos
// ...

// Constantes de períodos
const DATE_RANGES = {
  last7days: { label: "Últimos 7 dias", /* ... */ },
  // ...
}

// Context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Provider
export function DashboardProvider({ children }: { children: ReactNode }) {
  // ...
}

// Hook
export function useDashboard() {
  // ...
}
```

VALIDAÇÃO:
- Context deve funcionar sem erros de TypeScript
- Hook useDashboard() deve lançar erro se usado fora do Provider
- Estados iniciais devem ser os valores padrão (últimos 7 dias, todos usuários)

=== ENTREGÁVEL ===
Arquivo: hooks/use-dashboard-context.tsx
```

---

### Bloco 1.2 — Criar hook useFilteredData
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Bloco 1.1

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Crie o arquivo: hooks/use-filtered-data.ts

Hook que consome useDashboard() e retorna dados filtrados baseado nos filtros atuais.

REQUISITOS:

1. Recebe dados mock (ENRICHED_LEADS ou similar) e aplica filtros:
   - dateRange: filtrar leads criados no período
   - selectedUsers: filtrar por atualizadoPor (simular filtro de usuário)

2. Retornar:
   - filteredData: dados já filtrados
   - isLoading: boolean (simular loading por 300ms quando filtros mudam)
   - stats: métricas calculadas dos dados filtrados

3. Usar useEffect para re-filtrar quando dateRange ou selectedUsers mudarem

INTERFACE:
```typescript
interface UseFilteredDataResult {
  filteredLeads: EnrichedLead[]
  isLoading: boolean
  stats: {
    total: number
    newThisPeriod: number
    conversionRate: number
    avgTicket: number
  }
}
```

ARQUIVO: hooks/use-filtered-data.ts
```

---

## FASE 2 — Botões Individuais

### Bloco 2.1 — Botão PERÍODO (Funcional)
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Bloco 1.1

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Modifique o arquivo: components/dashboard-header.tsx

ATUALIZE o botão "Período" para ser funcional usando o DashboardContext.

REQUISITOS:

1. Importar useDashboard do hook criado anteriormente

2. No Popover de Período, tornar os botões clicáveis:
   - "Últimos 7 dias" → setDateRange(DATE_RANGES.last7days)
   - "Últimos 30 dias" → setDateRange(DATE_RANGES.last30days)
   - "Este mês" → setDateRange(DATE_RANGES.thisMonth)
   - "Mês passado" → setDateRange(DATE_RANGES.lastMonth)

3. Mostrar o período selecionado no botão (label dinâmico)
   - Ex: "Período: Últimos 7 dias" ou apenas "Últimos 7 dias"

4. Adicionar indicador visual no item selecionado (bg-secondary ou checkmark)

5. O Popover deve fechar automaticamente ao selecionar (usar state open do Popover)

ALTERAÇÕES ESPERADAS NO CÓDIGO:
- Adicionar import { useDashboard } from "@/hooks/use-dashboard-context"
- Adicionar estado para controlar abertura do popover
- Adicionar onClick handlers nos botões de período
- Atualizar label do trigger do popover dinamicamente
- Adicionar visual de "selected" no item ativo

VALIDAÇÃO:
- Ao clicar em um período, o label do botão deve atualizar
- Item selecionado deve ter destaque visual
- Popover deve fechar após seleção
```

---

### Bloco 2.2 — Botão USUÁRIOS (Funcional)
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Bloco 1.1

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Modifique o arquivo: components/dashboard-header.tsx

ATUALIZE o botão "Usuários" para ser funcional.

REQUISITOS:

1. Importar useDashboard e usar selectedUsers/toggleUser/setSelectedUsers

2. Lista de usuários mock (usar nomes já existentes no arquivo):
   - "todos" → representa todos usuários
   - "João Silva"
   - "Maria Santos"
   - "Pedro Oliveira"

3. Funcionalidades:
   - "Todos usuários" limpa a seleção (setSelectedUsers([]))
   - Clicar em um usuário específico: toggleUser(userId)
   - Permitir múltipla seleção (checkbox ou visual de selecionado)
   - Badge no botão mostrando quantos usuários selecionados (se > 0)

4. Visual:
   - Itens selecionados têm bg-secondary
   - Checkbox ou checkmark para indicar seleção
   - Se nenhum específico selecionado, mostrar "Todos usuários" no botão

IMPLEMENTAÇÃO DETALHADA:
```tsx
// Estado local para controle do popover
const [open, setOpen] = useState(false)

// Lista de usuários mock
const USERS = [
  { id: "all", name: "Todos usuários" },
  { id: "joao", name: "João Silva" },
  { id: "maria", name: "Maria Santos" },
  { id: "pedro", name: "Pedro Oliveira" },
]

// Handler de seleção
const handleSelect = (userId: string) => {
  if (userId === "all") {
    setSelectedUsers([])
  } else {
    toggleUser(userId)
  }
  // Não fecha popover para permitir multi-seleção
}
```

ARQUIVO: components/dashboard-header.tsx (modificar seção de Usuários)
```

---

### Bloco 2.3 — Botão EXPORTAR (PDF/Excel/CSV)
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Bloco 1.1, 1.2

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Modifique o arquivo: components/dashboard-header.tsx

IMPLEMENTE a funcionalidade de exportação para os 3 formatos.

REQUISITOS:

1. Criar funções de exportação (no arquivo ou utils separada):

   a) exportToPDF(): Simular geração de PDF
      - Usar window.print() como fallback simples OU
      - Criar blob com HTML formatado e download
      - Nome: dashboard-export-YYYY-MM-DD.pdf

   b) exportToExcel(): Gerar CSV formatado como XLSX
      - Headers: Data, Métrica, Valor
      - Linhas: KPIs atuais (receita, ticket médio, etc)
      - Nome: dashboard-export-YYYY-MM-DD.xlsx

   c) exportToCSV(): Gerar CSV puro
      - Mesmos dados do Excel
      - Separador: ; (pt-BR)
      - Nome: dashboard-export-YYYY-MM-DD.csv

2. Integrar com DashboardContext para pegar dados filtrados atuais

3. Mostrar toast de sucesso após exportação (usar sonner se disponível, ou alert simples)

4. Feedback visual: mostrar "Exportando..." enquanto gera

IMPLEMENTAÇÃO SUGERIDA:
```tsx
const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
  setIsExporting(true)
  
  // Simular delay de processamento
  await new Promise(r => setTimeout(r, 500))
  
  const data = {
    dateRange: dateRange.label,
    generatedAt: new Date().toISOString(),
    kpis: { /* dados atuais */ }
  }
  
  switch(type) {
    case 'pdf':
      // Lógica PDF
      break
    case 'excel':
      // Gerar CSV com BOM para Excel
      break
    case 'csv':
      // Gerar CSV
      break
  }
  
  setIsExporting(false)
  // Toast sucesso
}
```

VALIDAÇÃO:
- Cada opção deve baixar um arquivo
- Arquivos devem ter nomes com data
- Dados devem refletir os filtros atuais
```

---

### Bloco 2.4 — Botão ALERTAS (Sistema de Notificações)
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Nenhuma (componente isolado)

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Crie um novo componente e integre no dashboard-header.

ARQUIVOS:
1. Criar: components/notifications/notification-dropdown.tsx
2. Modificar: components/dashboard-header.tsx (substituir botão Alertas)

=== PARTE 1: NotificationDropdown Component ===

REQUISITOS:

1. Interface Notification:
```typescript
interface Notification {
  id: string
  type: 'lead' | 'system' | 'warning' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  link?: string
}
```

2. Mock data inicial (5 notificações variadas):
   - Novo lead recebido (há 5 min)
   - Meta de vendas atingida (há 2 horas)
   - Sistema: Backup completado (há 1 dia)
   - Alerta: Lead quente sem resposta (há 3 horas)
   - Novo comentário em lead (há 30 min)

3. Funcionalidades:
   - Listar notificações (mais recentes primeiro)
   - Marcar como lida (clicar na notificação)
   - Marcar todas como lidas
   - Badge mostrando count de não lidas
   - Indicador visual de não lidas (ponto azul)
   - Agrupar por: Hoje, Ontem, Anteriores

4. Visual:
   - Ícone de tipo (diferentes cores)
   - Título em negrito (se não lida)
   - Timestamp relativo ("há 5 min", "há 2 horas")
   - Hover effect
   - Footer com "Ver todas" (link para /notificacoes - pode ser # por enquanto)

ESTRUTURA:
```tsx
<Popover>
  <PopoverTrigger>
    <BellIcon />
    {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <Header>
      <Title>Notificações</Title>
      <Button variant="ghost" size="sm" onClick={markAllRead}>
        Marcar todas
      </Button>
    </Header>
    <ScrollArea className="h-[300px]">
      {notifications.map(n => <NotificationItem key={n.id} {...n} />)}
    </ScrollArea>
    <Footer>
      <Link href="/notificacoes">Ver todas</Link>
    </Footer>
  </PopoverContent>
</Popover>
```

=== PARTE 2: Integrar em dashboard-header.tsx ===

Substituir o botão Alertas atual (linhas 104-110) pelo novo NotificationDropdown.

Manter: 
- O divider (linha 101)
- O botão Novo Lead (linhas 112-116)
```

---

### Bloco 2.5 — Botão NOVO LEAD (Modal Rápido)
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Nenhuma

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Crie um novo componente e integre no dashboard-header.

ARQUIVOS:
1. Criar: components/leads/quick-lead-modal.tsx
2. Modificar: components/dashboard-header.tsx (substituir botão Novo Lead)

=== PARTE 1: QuickLeadModal Component ===

REQUISITOS:

1. Dialog/modal para criação rápida de lead (versão simplificada do /contatos/novo)

2. Campos obrigatórios (form com React Hook Form + Zod):
   - Nome* (Input)
   - Email* (Input type="email")
   - Telefone* (Input)
   - Origem* (Select: Website, Instagram, Facebook, Indicação, Outro)

3. Campos opcionais (colapsáveis ou em aba secundária):
   - Tags (Multi-select com as tags existentes do MOCK_TAGS)
   - Observações (Textarea)

4. Ações:
   - Botão "Criar Lead" (primário #9795e4)
   - Botão "Cancelar" (outline)
   - Link "Criar completo →" (redireciona para /contatos/novo)

5. Comportamento:
   - Validar campos obrigatórios
   - Mostrar loading no botão durante "submit"
   - Fechar modal após sucesso
   - Mostrar toast de sucesso
   - Limpar formulário ao fechar

6. Integração:
   - Adicionar novo lead ao ENRICHED_LEADS (simular no estado local)
   - Ou apenas mostrar sucesso sem persistir (mock)

ESTRUTURA:
```tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const quickLeadSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(8, "Telefone é obrigatório"),
  origem: z.string().min(1, "Origem é obrigatória"),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
})

type QuickLeadForm = z.infer<typeof quickLeadSchema>

export function QuickLeadModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  // ... implementação
}
```

=== PARTE 2: Integrar em dashboard-header.tsx ===

Substituir o botão Novo Lead (linhas 112-116) para abrir o QuickLeadModal.

Manter o mesmo visual do botão atual.
```

---

## FASE 3 — Integração e Polish

### Bloco 3.1 — Atualizar Dashboard para usar Contexto
**Agente:** `@dev`  
**Skill:** `coding-guidelines`  
**Dependências:** Todos os blocos anteriores

```
AGENTE: @dev
SKILL: coding-guidelines

=== TAREFA ===
Modifique o arquivo: app/page.tsx

INTEGRE o DashboardProvider e useFilteredData para que os filtros afetem os dados.

REQUISITOS:

1. Importar DashboardProvider e envolver o conteúdo:
```tsx
import { DashboardProvider } from "@/hooks/use-dashboard-context"

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

function DashboardContent() {
  const { filteredLeads, isLoading, stats } = useFilteredData()
  // ... resto do conteúdo usando dados filtrados
}
```

2. Atualizar KPIs para usar stats do hook filtrado

3. Passar filteredLeads para os componentes de gráficos

4. Adicionar loading states (skeletons) quando isLoading = true

5. Verificar que todos os componentes renderizam corretamente com dados filtrados

ALTERAÇÕES ESPERADAS:
- Extrair conteúdo para componente interno DashboardContent
- Usar dados filtrados em vez de ENRICHED_LEADS direto
- KPIs dinâmicos baseados no período selecionado
```

---

### Bloco 3.2 — QA e Testes Visuais
**Agente:** `@qa`  
**Skill:** N/A (skill de QA implícita)
**Dependências:** Todos os blocos anteriores

```
AGENTE: @qa

=== TAREFA ===
Execute checklist de QA para os 5 botões implementados.

CHECKLIST PERÍODO:
- [ ] Clique abre popover
- [ ] Todas as 4 opções visíveis
- [ ] Seleção atual destacada
- [ ] Label do botão atualiza após seleção
- [ ] Popover fecha ao selecionar
- [ ] KPIs atualizam quando período muda

CHECKLIST USUÁRIOS:
- [ ] Clique abre popover
- [ ] "Todos usuários" limpa seleção
- [ ] Múltiplos usuários podem ser selecionados
- [ ] Badge mostra contagem quando > 0
- [ ] Itens selecionados têm destaque visual

CHECKLIST EXPORTAR:
- [ ] Menu dropdown abre corretamente
- [ ] PDF baixa arquivo
- [ ] Excel baixa arquivo
- [ ] CSV baixa arquivo
- [ ] Nome dos arquivos inclui data
- [ ] Dados refletem filtros atuais

CHECKLIST ALERTAS:
- [ ] Badge mostra contagem de não lidas
- [ ] Clique abre dropdown com lista
- [ ] Notificações agrupadas por data
- [ ] Não lidas têm indicador visual
- [ ] Clicar marca como lida
- [ ] "Marcar todas" funciona
- [ ] Scroll funciona se lista longa

CHECKLIST NOVO LEAD:
- [ ] Clique abre modal
- [ ] Campos obrigatórios validam
- [ ] Erros de validação visíveis
- [ ] Submit mostra loading
- [ ] Sucesso fecha modal e mostra toast
- [ ] Link "Criar completo" redireciona

DOCUMENTAR:
- Criar arquivo: docs/qa/DASHBOARD_HEADER_QA_REPORT.md
- Listar bugs encontrados (se houver)
- Print das funcionalidades (opcional)
```

---

## FASE 4 — Refinamentos (Opcional/Bônus)

### Bloco 4.1 — Persistência de Filtros
**Agente:** `@dev`  
**Prioridade:** Baixa

```
Adicionar localStorage para persistir filtros entre recarregamentos:
- Último período selecionado
- Usuários selecionados

Usar useEffect no DashboardProvider para salvar/carregar.
```

### Bloco 4.2 — Animações
**Agente:** `@dev`  
**Prioridade:** Baixa

```
Adicionar transições suaves:
- Framer Motion para troca de dados nos KPIs
- AnimatePresence para notificações
- Transição no badge de contagem
```

---

## Resumo de Arquivos

### Arquivos Criados
```
hooks/
  use-dashboard-context.tsx     # Contexto global
  use-filtered-data.ts          # Hook de dados filtrados

components/
  notifications/
    notification-dropdown.tsx   # Dropdown de alertas
  leads/
    quick-lead-modal.tsx        # Modal rápido de novo lead
```

### Arquivos Modificados
```
components/
  dashboard-header.tsx          # Todos os 5 botões

app/
  page.tsx                      # Integração do contexto
```

### Arquivos de QA
```
docs/qa/
  DASHBOARD_HEADER_QA_REPORT.md # Relatório de testes
```

---

## Ordem de Execução Recomendada

```
Sprint 1 — Fundação
├── [1.1] DashboardContext (@dev)
├── [1.2] useFilteredData hook (@dev)
└── [3.1] Atualizar Dashboard (@dev)

Sprint 2 — Botões (podem ser paralelos)
├── [2.1] Período (@dev)
├── [2.2] Usuários (@dev)
├── [2.3] Exportar (@dev)
├── [2.4] Alertas (@dev)
└── [2.5] Novo Lead (@dev)

Sprint 3 — QA
└── [3.2] QA Report (@qa)

Sprint 4 — Polish (opcional)
├── [4.1] Persistência
└── [4.2] Animações
```

---

*Documento criado para Synkra AIOS · Agents Pattern*
