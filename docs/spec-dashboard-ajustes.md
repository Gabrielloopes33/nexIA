# Spec: Implementação de Ajustes do Dashboard

## 1. Files to Modify

### `app/page.tsx`
**Purpose**: Reorganizar layout do grid de 3 colunas

**Changes**:
- Mover `ActivityHeatmap` da coluna 2 para coluna 3
- Reorganizar ordem na coluna 2: DealProgress → RecentLeads → ActivitiesComplete → LeadTrends
- Coluna 3 fica: DealConversion → ActivityHeatmap → ConversionDonutChart → UTMPerformance

**Before/After Code**:
```typescript
// Coluna 2 (ANTES):
<DealProgressChart />
<ActivityHeatmap />          // ← MOVER
<ActivitiesCompleteChart />
<LeadTrendsChart />
<ConversionDonutChart />     // ← MOVER

// Coluna 2 (DEPOIS):
<DealProgressChart />
<RecentLeads />              // ← JÁ ESTÁ AQUI
<ActivitiesCompleteChart />
<LeadTrendsChart />

// Coluna 3 (ANTES):
<DealConversionChart />
<RecentLeads />              // ← MOVER
<UTMPerformanceChart />
<RevenueForecastChart />     // ← REMOVER

// Coluna 3 (DEPOIS):
<DealConversionChart />
<ActivityHeatmap />          // ← NOVO
<ConversionDonutChart />     // ← AQUI
<UTMPerformanceChart />
```

---

### `components/vertical-kpi-card.tsx`
**Purpose**: Aumentar tamanho do título dos KPIs

**Changes**:
- Linha 52: Alterar classes do label

**Before**:
```tsx
<p className="mb-1 text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
```

**After**:
```tsx
<p className="mb-1 text-sm font-bold text-foreground leading-tight">{label}</p>
```

**Rationale**: Alinhar com o padrão de destaque do card "Objeções Detectadas"

---

### `components/dashboard-header.tsx`
**Purpose**: Ajustar textos dos botões conforme referência visual

**Changes**:

#### 1. Botão Notificações (linha 99-104)
**Before**:
```tsx
<button className="relative flex h-10 w-10 items-center justify-center rounded-sm border-2 border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
  <Bell className="h-[18px] w-[18px]" />
  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
    3
  </span>
</button>
```

**After**:
```tsx
<button className="relative flex h-10 items-center justify-center gap-2 rounded-sm border-2 border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
  <Bell className="h-[18px] w-[18px]" />
  <span className="text-sm">Notificações</span>
  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
    3
  </span>
</button>
```

#### 2. Botão Novo Lead (linha 106-109)
**Before**:
```tsx
<button className="flex h-10 items-center gap-2 rounded-sm bg-gradient-to-r from-[#9795e4] to-[#b3b3e5] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
  <Plus className="h-4 w-4" />
  <span>Novo</span>
</button>
```

**After**:
```tsx
<button className="flex h-10 items-center gap-2 rounded-sm bg-gradient-to-r from-[#9795e4] to-[#b3b3e5] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
  <Plus className="h-4 w-4" />
  <span>Novo Lead</span>
</button>
```

---

### `components/contextual-sub-sidebar.tsx`
**Purpose**: Adicionar animação de entrada/saída suave

**Changes**:

#### 1. Adicionar estado de animação (linha 13-14)
**Before**:
```tsx
export function ContextualSubSidebar() {
  const { isOpen, activeNavItem, closePanel } = useSubSidebar()

  if (!isOpen || !activeNavItem) {
    return null
  }
```

**After**:
```tsx
'use client'

import { useState, useEffect } from 'react'
// ... outros imports

export function ContextualSubSidebar() {
  const { isOpen, activeNavItem, closePanel } = useSubSidebar()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen && activeNavItem) {
      // Pequeno delay para garantir que o componente foi montado
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, activeNavItem])

  if (!isOpen || !activeNavItem) {
    return null
  }
```

#### 2. Aplicar classes de animação (linha 57-62)
**Before**:
```tsx
  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r-2 border-border bg-background transition-all duration-300',
        'w-[200px] mt-[76px]'
      )}
    >
```

**After**:
```tsx
  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r-2 border-border bg-background',
        'w-[200px] mt-[76px]',
        'transform transition-all duration-200 ease-out',
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : '-translate-x-4 opacity-0'
      )}
    >
```

**Rationale**: 
- `duration-200` para animação rápida e leve
- `-translate-x-4` para slide sutil da esquerda
- `ease-out` para desaceleração natural

---

### `components/sidebar.tsx`
**Purpose**: Garantir feedback visual suave no botão ativo

**Changes**: Nenhuma alteração necessária - o componente já usa `transition-all` nas classes dos botões (linha 76 e 100).

---

## 2. Integration Points

### Data Flow
- Nenhuma mudança no fluxo de dados
- Alterações puramente visuais/estruturais

### Component Dependencies
- `VerticalKpiCard` é usado em `app/page.tsx` - mudança de estilo afeta todos os 4 KPIs
- `ContextualSubSidebar` depende de `useSubSidebar` - animação não quebra o contexto

### CSS/Tailwind Classes Reutilizadas
- `transition-all duration-200` - padrão de animação
- `ease-out` - timing function para animações suaves
- `transform` - habilita transformações GPU-accelerated

---

## 3. Implementation Order

1. **vertical-kpi-card.tsx** - Mudança simples de estilo, sem dependências
2. **dashboard-header.tsx** - Ajuste de texto em botões
3. **contextual-sub-sidebar.tsx** - Adicionar animação
4. **page.tsx** - Reorganizar layout (por último para validar visual)

---

## 4. Testing Strategy

### Manual Testing Steps

#### Layout
1. Abrir dashboard em tela grande (1920px+)
2. Verificar que Mapa de Atividade está ao lado de Funil de Conversão
3. Verificar que Leads Recentes está na coluna 2
4. Redimensionar para mobile - verificar que grid responde corretamente

#### KPI Cards
1. Verificar que os 4 cards (Pipeline Total, Ticket Médio, Tempo Conversão, Lead Score) têm títulos em negrito
2. Comparar visualmente com card "Objeções Detectadas"

#### Botões
1. Verificar que botão Notificações mostra texto "Notificações" + badge com número
2. Verificar que botão Novo Lead mostra texto "Novo Lead"
3. Testar hover states em todos os botões

#### Animação
1. Clicar em item da sidebar roxa
2. Verificar que sub-sidebar aparece com slide suave da esquerda (200ms)
3. Clicar em outro item - animação deve ser suave na transição
4. Clicar no X para fechar - deve desaparecer com fade out
5. Testar com `prefers-reduced-motion` ativo (deve respeitar configuração)

### Visual Regression
- Comparar screenshot antes/depois dos ajustes
- Validar que não há quebra de layout em nenhum breakpoint

---

## 5. Rollback Plan

Se necessário, cada alteração pode ser revertida individualmente:

1. **Layout**: Restaurar ordem original dos componentes em `page.tsx`
2. **KPI Titles**: Reverter para `text-[10px] font-medium text-muted-foreground`
3. **Botões**: Remover texto adicional, voltar para ícone apenas
4. **Animação**: Remover estado `isVisible` e classes de transform

---

## Checklist Pré-Implementação

- [ ] Backup dos arquivos originais
- [ ] Validar referência visual da imagem
- [ ] Testar animação em diferentes navegadores
- [ ] Verificar contraste dos novos títulos (acessibilidade)
