# PRD: Dashboard Enterprise - Estilo Pipedrive

## Feature Summary
Reorganização completa do dashboard para seguir padrão enterprise (Pipedrive/Salesforce) com hierarquia visual clara, consistência total nos cards e experiência mobile otimizada.

**Restrições Fixas:**
- 🟣 Roxo (#9795e4) é INEGOCIÁVEL - cor principal da marca
- Cliente quer MUITA informação na tela (densidade alta aceita)
- CRM orientado a Dados e IA (cada cliente tem banco de dados próprio)

---

## Affected Files

### Files to Modify

#### 1. `app/page.tsx` (CRITICAL)
- **O que muda**: Reorganização completa do grid
- **Impacto**:
  - Leads Recentes → primeira fileira, coluna 2
  - Mapa de Atividade → primeira fileira, coluna 3
  - Progresso de Negócios → remover da primeira posição
  - Conversão de Negócios → remover da primeira posição
  - Novo sistema de ordem hierárquica

#### 2. `app/globals.css` (CRITICAL)
- **O que muda**: Media queries mobile
- **Impacto**:
  - Forçar cards laterais (KPIs) a NUNCA irem para topo
  - Manter sempre na coluna esquerda, mesmo em mobile
  - Grid alternativo para mobile

#### 3. `components/contextual-sub-sidebar.tsx` (HIGH)
- **O que muda**: Animação expansiva
- **Impacto**:
  - Animar entrada da sub-sidebar
  - Disparar evento/estado para dashboard se redimensionar
  - Transição suave de 200-300ms

#### 4. `components/sidebar.tsx` (MEDIUM)
- **O que muda**: Trigger de animação
- **Impacto**:
  - Comunicar estado para layout principal
  - Feedback visual no botão ativo

#### 5. `lib/contexts/sidebar-context.tsx` (HIGH)
- **O que muda**: Novo estado global
- **Impacto**:
  - Adicionar estado `isAnimating` ou `sidebarWidth`
  - Permitir que dashboard escute mudanças

#### 6. TODOS os componentes de cards (MEDIUM)
- **Lista**:
  - `components/vertical-kpi-card.tsx`
  - `components/charts/deal-progress-chart.tsx`
  - `components/charts/deal-conversion-chart.tsx`
  - `components/charts/activities-complete-chart.tsx`
  - `components/charts/revenue-forecast-chart.tsx`
  - `components/lead-trends-chart.tsx`
  - `components/conversion-donut-chart.tsx`
  - `components/activity-heatmap.tsx`
  - `components/recent-leads.tsx`
  - `components/utm-performance-chart.tsx`
  - `components/objections-chart.tsx`
  - `components/tag-performance-chart.tsx`

- **O que muda**: Consistência visual
- **Impacto**:
  - Mesma estrutura: Header (título + badge) + Content
  - Mesmas cores de badge (roxo para neutro, verde para positivo)
  - Mesmo padding interno (p-4)
  - Mesmo border-radius (rounded-sm)
  - Mesmo comportamento de hover

---

## Visual Target (Layout Final)

### Desktop (1920px+)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [LOGO]  Dashboard                                              [BOTÕES]│
├─────────┬────────────────────────────┬──────────────────────────────────┤
│         │                            │                                  │
│ Pipeline│  LEADS RECENTES   ←───     │  MAPA DE ATIVIDADE   ←───        │
│  Total  │  (herói - grande)          │  (heatmap - destaque)            │
├─────────┤                            │                                  │
│  Ticket │                            ├──────────────────────────────────┤
│  Médio  │                            │                                  │
├─────────┤                            │  FUNIL DE CONVERSÃO              │
│  Tempo  │                            │                                  │
├─────────┤                            ├──────────────────────────────────┤
│  Lead   │                            │                                  │
│  Score  │                            │  PERFORMANCE UTM                 │
├─────────┤                            │                                  │
│         │                            ├──────────────────────────────────┤
│ Objeções│                            │                                  │
│         │                            │  PROGRESSO DE NEGÓCIOS           │
├─────────┤                            │                                  │
│  Tags   │                            ├──────────────────────────────────┤
│         │                            │                                  │
├─────────┤                            │  TENDÊNCIA DE LEADS              │
│         │                            │                                  │
│         │                            ├──────────────────────────────────┤
│         │                            │                                  │
│         │                            │  ATIVIDADES COMPLETAS            │
│         │                            │                                  │
│         │                            │                                  │
└─────────┴────────────────────────────┴──────────────────────────────────┘
```

### Mobile (Forçado - Cards Laterais Fixos)
```
┌─────────────────────────────────────┐
│ Dashboard            [BOTÕES]       │
├─────────────────────────────────────┤
│                                     │
│  PIPELINE TOTAL                     │ ← KPIs sempre primeiro
│  R$ 2.4M                    +12.5%  │
├─────────────────────────────────────┤
│  TICKET MÉDIO                       │
│  R$ 4.2k                     +8.3%  │
├─────────────────────────────────────┤
│  TEMPO DE CONVERSÃO                 │
│  12 dias                     -2.1%  │
├─────────────────────────────────────┤
│  LEAD SCORE MÉDIO                   │
│  72/100                      +5.7%  │
├─────────────────────────────────────┤
│  OBJEÇÕES DETECTADAS                │
├─────────────────────────────────────┤
│  PERFORMANCE POR TAG                │
├─────────────────────────────────────┤
│                                     │
│  LEADS RECENTES                     │ ← Depois os cards grandes
│  [lista de leads...]                │
├─────────────────────────────────────┤
│  MAPA DE ATIVIDADE                  │
│  [heatmap...]                       │
├─────────────────────────────────────┤
│  ... demais cards ...               │
└─────────────────────────────────────┘
```

**REGRA DE OURO**: Em mobile, os 4 KPIs + Objeções + Tags NUNCA sobem. Eles ficam fixos no topo, sempre na ordem vertical.

---

## Especificações Técnicas

### Animação da Sub-Sidebar + Dashboard

**Fluxo:**
1. Usuário clica em item da sidebar
2. Sub-sidebar começa animação (200ms)
3. Dashboard detecta mudança e inicia redimensionamento (200ms)
4. Ambos terminam juntos

**Implementação:**
```css
/* Sub-sidebar */
transform: translateX(-16px) → translateX(0)
opacity: 0 → 1
duration: 200ms
easing: ease-out

/* Dashboard */
margin-left: 0 → 200px /* quando sub-sidebar abre */
transition: margin-left 200ms ease-out
```

### Sistema de Consistência (Design Tokens)

**Cards:**
- Padding: `p-4`
- Border: `border-2 border-border`
- Border-radius: `rounded-sm`
- Background: `bg-card` (branco)

**Headers:**
- Título: `text-lg font-bold text-foreground`
- Subtítulo: `text-xs text-muted-foreground`
- Badge (neutro): `bg-[#9795e4]/10 text-[#9795e4]`
- Badge (positivo): `bg-[#027E46]/10 text-[#027E46]`
- Badge (negativo): `bg-[#C23934]/10 text-[#C23934]`

**Conteúdo:**
- Gráficos: altura mínima 180px
- Listas: max-height com scroll
- Valores: `text-2xl font-bold` para destaque

---

## Edge Cases

### Mobile < 640px
- Sidebar principal vira drawer/bottom sheet
- Sub-sidebar desabilitada ou vira modal
- Cards laterais (KPIs) em stack vertical absoluto
- Cards principais abaixo

### Tablet 640px - 1024px
- Manter 3 colunas mas com widths diferentes
- KPIs menores (mais compactos)
- Sub-sidebar pode ser drawer lateral

### Desktop > 1024px
- Layout full 3 colunas
- Sub-sidebar fixa ao lado da sidebar roxa
- Dashboard redimensiona suavemente

### Animação Interrompida
- Se usuário clicar múltiplas vezes rapidamente
- Usar `isAnimating` flag para prevenir spam
- Ou usar `prefers-reduced-motion` para desabilitar

---

## Acceptance Criteria

### Layout
- [ ] Leads Recentes está na primeira fileira, coluna 2
- [ ] Mapa de Atividade está na primeira fileira, coluna 3
- [ ] KPIs verticais NUNCA sobem em mobile
- [ ] Sub-sidebar abre com animação suave
- [ ] Dashboard redimensiona junto com sub-sidebar

### Consistência
- [ ] Todos os cards têm mesma estrutura visual
- [ ] Todos os títulos são `text-lg font-bold`
- [ ] Todos os badges seguem padrão de cor
- [ ] Mesmo padding interno em todos os cards
- [ ] Mesmo comportamento de hover

### Mobile
- [ ] KPIs sempre no topo, nunca no bottom
- [ ] Cards em ordem vertical fixa
- [ ] Scroll funciona corretamente
- [ ] Sidebar principal é acessível

### Performance
- [ ] Animação não trava em devices lentos
- [ ] Redimensionamento é smooth (60fps)
- [ ] Não há layout shift após animação
