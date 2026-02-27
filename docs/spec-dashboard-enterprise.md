# Spec: Implementação Dashboard Enterprise

## 1. Files to Modify

---

### `lib/contexts/sidebar-context.tsx`
**Purpose**: Adicionar estado de animação compartilhado

**Changes**:
```typescript
// Adicionar ao contexto:
interface SubSidebarContextType {
  isOpen: boolean
  activeNavItem: NavItemKey | null
  isAnimating: boolean        // NOVO
  sidebarWidth: number        // NOVO (0 ou 200)
  togglePanel: (item: NavItemKey) => void
  closePanel: () => void
  openPanel: (item: NavItemKey) => void
}

// Implementar:
const [isAnimating, setIsAnimating] = useState(false)
const [sidebarWidth, setSidebarWidth] = useState(0)

// No togglePanel:
const togglePanel = (item: NavItemKey) => {
  setIsAnimating(true)
  if (activeNavItem === item && isOpen) {
    setSidebarWidth(0)
    setTimeout(() => {
      setIsOpen(false)
      setActiveNavItem(null)
      setIsAnimating(false)
    }, 200)
  } else {
    setIsOpen(true)
    setActiveNavItem(item)
    setTimeout(() => {
      setSidebarWidth(200)
      setIsAnimating(false)
    }, 10)
  }
}
```

---

### `app/globals.css`
**Purpose**: Forçar cards laterais a nunca subirem em mobile

**Changes**:
```css
/* Adicionar ao final do arquivo */

/* Mobile: Forçar ordem dos cards */
@media (max-width: 1279px) {
  /* Container principal do dashboard */
  .dashboard-grid {
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Cards laterais (KPIs) sempre primeiro */
  .kpi-sidebar {
    order: -9999 !important;
    width: 100% !important;
  }
  
  /* Grids internos dos KPIs em mobile */
  .kpi-sidebar > div {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.5rem !important;
  }
  
  /* Cards principais depois */
  .main-content {
    order: 1 !important;
    width: 100% !important;
  }
  
  /* Esconder sub-sidebar em mobile */
  .sub-sidebar {
    display: none !important;
  }
}

/* Animação de redimensionamento do dashboard */
.dashboard-main {
  transition: margin-left 200ms ease-out, width 200ms ease-out;
}

.dashboard-main.with-sidebar {
  margin-left: 200px;
}

/* Suavizar animações */
@media (prefers-reduced-motion: reduce) {
  .dashboard-main,
  .sub-sidebar {
    transition: none !important;
  }
}
```

---

### `app/page.tsx` (REORGANIZAÇÃO COMPLETA)
**Purpose**: Novo layout hierárquico Pipedrive-style

**Changes**:

**Estrutura do Grid (Nova)**:
```typescript
// LAYOUT DESKTOP:
// Coluna 1 (220px): 4 KPIs + Objeções + Tags
// Coluna 2 (flex): Leads Recentes (herói) + ActivitiesComplete + LeadTrends + DealProgress
// Coluna 3 (flex): Mapa Atividade (herói) + ConversionDonut + UTM + DealConversion

<div className="dashboard-grid mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
  
  {/* COLUNA 1: KPIs Verticais (SEMPRE FIXOS) */}
  <div className="kpi-sidebar flex flex-col gap-3 md:col-span-2 xl:col-span-1">
    {/* Grid dos 4 KPIs - em xl fica vertical, em mobile fica 2x2 */}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
      <VerticalKpiCard label="Pipeline Total" ... />
      <VerticalKpiCard label="Ticket Médio" ... />
      <VerticalKpiCard label="Tempo de Conversão" ... />
      <VerticalKpiCard label="Lead Score Médio" ... />
    </div>
    
    <ObjectionsChart />
    <TagPerformanceChart />
  </div>

  {/* COLUNA 2: Cards Principais */}
  <div className="main-content flex flex-col gap-4">
    {/* HERO 1: Leads Recentes (grande) */}
    <RecentLeads />
    
    {/* Secundários */}
    <ActivitiesCompleteChart />
    <LeadTrendsChart />
    <DealProgressChart />
  </div>

  {/* COLUNA 3: Cards Principais */}
  <div className="main-content flex flex-col gap-4">
    {/* HERO 2: Mapa de Atividade (grande) */}
    <ActivityHeatmap />
    
    {/* Secundários */}
    <ConversionDonutChart />
    <UTMPerformanceChart />
    <DealConversionChart />
  </div>
  
</div>
```

**Ordem dos imports ajustar**:
- Remover `RevenueForecastChart` se não estiver sendo usado
- Verificar se `ActivityHeatmap` está importado

---

### `components/contextual-sub-sidebar.tsx`
**Purpose**: Animação suave + integração com contexto

**Changes**:
```typescript
// Usar o novo contexto
const { isOpen, activeNavItem, closePanel, sidebarWidth, isAnimating } = useSubSidebar()

// Aplicar classes de animação
return (
  <div
    className={cn(
      'sub-sidebar relative flex h-full flex-col border-r-2 border-border bg-background',
      'w-[200px] mt-[76px]',
      'transform transition-transform duration-200 ease-out',
      sidebarWidth > 0 ? 'translate-x-0' : '-translate-x-full'
    )}
    style={{
      marginLeft: sidebarWidth > 0 ? 0 : -200,
    }}
  >
    {/* ... resto do conteúdo */}
  </div>
)
```

---

### `components/sidebar.tsx`
**Purpose**: Feedback visual no botão ativo

**Changes**:
```typescript
// Adicionar classe de animação no botão ativo
className={cn(
  "flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-200",
  isActive
    ? "bg-white/30 text-white"
    : "text-white hover:bg-white/15",
  isPanelActive && "ring-2 ring-white/40 scale-110" // NOVO: scale
)}
```

---

### PADRONIZAÇÃO DE TODOS OS CARDS

Cada card deve seguir este padrão:

```typescript
// Estrutura base
<Card className="rounded-sm border-2 border-border bg-card overflow-hidden">
  {/* HEADER PADRÃO */}
  <CardHeader className="p-4 pb-2">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-lg font-bold text-foreground">
          {titulo}
        </CardTitle>
        {subtitulo && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitulo}
          </p>
        )}
      </div>
      
      {/* BADGE PADRÃO (se houver) */}
      {badge && (
        <div className={cn(
          "flex items-center gap-1.5 rounded-sm px-2 py-1",
          badge.variant === 'positive' && "bg-[#027E46]/10 text-[#027E46]",
          badge.variant === 'negative' && "bg-[#C23934]/10 text-[#C23934]",
          badge.variant === 'neutral' && "bg-[#9795e4]/10 text-[#9795e4]",
          badge.variant === 'warning' && "bg-[#FFB75D]/10 text-[#FFB75D]"
        )}>
          {badge.icon && <badge.icon className="h-3 w-3" />}
          <span className="text-xs font-semibold">{badge.value}</span>
        </div>
      )}
    </div>
  </CardHeader>
  
  {/* CONTENT */}
  <CardContent className="p-4 pt-2">
    {children}
  </CardContent>
  
  {/* FOOTER OPCIONAL */}
  {footer && (
    <CardFooter className="p-4 pt-0">
      {footer}
    </CardFooter>
  )}
</Card>
```

**Cards a modificar:**
1. `vertical-kpi-card.tsx` - Já está bom, só ajustar padding
2. `recent-leads.tsx` - Transformar em Card com header
3. `activity-heatmap.tsx` - Transformar em Card com header
4. `conversion-donut-chart.tsx` - Ajustar header
5. `deal-progress-chart.tsx` - Ajustar header
6. `deal-conversion-chart.tsx` - Ajustar header
7. `activities-complete-chart.tsx` - Já está bom
8. `lead-trends-chart.tsx` - Transformar em Card
9. `utm-performance-chart.tsx` - Ajustar header
10. `objections-chart.tsx` - Ajustar header
11. `tag-performance-chart.tsx` - Ajustar header

---

## 2. Implementation Order

1. **`sidebar-context.tsx`** - Fundação da animação
2. **`globals.css`** - Regras mobile críticas
3. **`contextual-sub-sidebar.tsx`** - Animação da sidebar
4. **`sidebar.tsx`** - Feedback visual
5. **`page.tsx`** - Reorganização do layout
6. **Cards individuais** - Padronização visual

---

## 3. Testing Strategy

### Desktop
1. Clicar em item da sidebar → sub-sidebar anima suave
2. Dashboard deve redimensionar junto
3. Verificar ordem: Leads Recentes e Mapa de Atividade no topo
4. Todos os cards devem ter mesmo estilo de header

### Mobile (< 640px)
1. Redimensionar para 375px
2. Verificar que KPIs (Pipeline, Ticket, etc) estão NO TOPO
3. Verificar que NÃO estão no bottom
4. Verificar ordem vertical correta

### Tablet (640px - 1279px)
1. Verificar comportamento intermediário
2. KPIs ainda em cima
3. Sub-sidebar pode estar escondida

---

## 4. Rollback Plan

Cada mudança é independente:
1. Contexto: Remover estados novos
2. CSS: Remover media queries
3. Layout: Reverter ordem dos cards
4. Cards: Reverter headers individuais

---

## Checklist

- [ ] Contexto com isAnimating e sidebarWidth
- [ ] CSS mobile forçando ordem dos cards
- [ ] Sub-sidebar com animação translate-x
- [ ] Dashboard redimensiona com margin-left
- [ ] Leads Recentes na primeira fileira
- [ ] Mapa de Atividade na primeira fileira
- [ ] Todos os cards com header padronizado
- [ ] Teste em mobile confirmando KPIs no topo
