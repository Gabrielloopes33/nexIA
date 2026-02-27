# PRD: Ajustes de Layout e UI do Dashboard

## Feature Summary
Ajustes visuais e de layout no dashboard principal para melhorar a hierarquia visual, organização dos cards e experiência de navegação.

---

## Affected Files

### Files to Create
- *Nenhum arquivo novo necessário*

### Files to Modify

#### 1. `app/page.tsx`
- **O que muda**: Reorganização do grid de 3 colunas
- **Impacto**: 
  - Mover `ActivityHeatmap` da coluna 2 para posição ao lado de `ConversionDonutChart`
  - Reposicionar `RecentLeads` para coluna 2
  - Ajustar ordem dos cards na coluna 3

#### 2. `components/vertical-kpi-card.tsx`
- **O que muda**: Estilização do título do card
- **Impacto**: 
  - Aumentar fonte do label de `text-[10px]` para `text-sm font-bold`
  - Manter consistência com título de "Objeções Detectadas"

#### 3. `components/dashboard-header.tsx`
- **O que muda**: Textos dos botões
- **Impacto**:
  - Botão Período: manter como está (já tem texto)
  - Botão Usuários: manter como está (já tem texto)
  - Botão Exportar: manter como está (já tem texto)
  - Botão Notificações: adicionar texto "Notificações" + badge
  - Botão Novo: alterar de "Novo" para "Novo Lead"

#### 4. `components/contextual-sub-sidebar.tsx`
- **O que muda**: Adicionar animação de entrada/saída
- **Impacto**:
  - Implementar animação CSS/Tailwind suave
  - Transição de slide + fade
  - Duração: 200ms ease-out

#### 5. `components/sidebar.tsx`
- **O que muda**: Trigger da animação da sub-sidebar
- **Impacto**:
  - Garantir que o clique dispare a transição corretamente
  - Feedback visual no botão ativo

---

## Existing Patterns

### Grid Layout Pattern
O projeto usa um grid de 3 colunas responsivo:
```
xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]
```

### Animação Pattern
O projeto já usa `transition-all duration-300` em alguns componentes. Devemos manter consistência.

### Card Title Pattern
Cards maiores usam `text-lg font-bold`, cards menores usam `text-sm font-semibold`. Os KPIs verticais devem seguir o padrão intermediário `text-sm font-bold`.

---

## Constraints

### Layout Constraints
- Manter estrutura de 3 colunas no breakpoint `xl`
- Coluna 1 tem largura fixa de 220px
- Cards devem manter alturas proporcionais

### Animação Constraints
- Usar apenas Tailwind CSS transitions (sem bibliotecas externas)
- Duração máxima: 300ms
- Deve respeitar `prefers-reduced-motion`

### Acessibilidade Constraints
- Badge de notificações deve ser anunciado por screen readers
- Animações não devem causar motion sickness

---

## Edge Cases

1. **Sub-sidebar já aberta**: Se usuário clicar em outro item da sidebar, animação deve ser suave
2. **Mobile**: Em telas pequenas, o grid muda para 1 coluna - não aplicar animação de slide
3. **KPIs**: Labels longos podem quebrar linha - testar com textos maiores
4. **Badge de notificações**: Posicionamento deve ajustar quando texto é adicionado

---

## Visual Reference

### Layout Alvo (Dashboard)
```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard          [Período] [Todos usuários] [Exportar] [Notif] [Novo Lead] │
├─────────┬────────────────────────────┬───────────────────────────┤
│ Pipeline│  Progresso de Negócios     │  Conversão de Negócios    │
│ Ticket  │                            │                           │
│ Tempo   ├────────────────────────────┼───────────────────────────┤
│ Score   │  Leads Recentes            │  Mapa de Atividade        │  <-- AQUI
│         │                            │  Funil de Conversão       │
│ Objeções├────────────────────────────┼───────────────────────────┤
│         │  Atividades Completas      │  Performance UTM          │
│ Tags    │                            │                           │
└─────────┴────────────────────────────┴───────────────────────────┘
```

### Botões Alvo
```
[📅 Período ▼] [👤 Todos usuários] [⬇️ Exportar] [🔔 Notificações ³] [➕ Novo Lead]
```

---

## Acceptance Criteria

- [ ] Mapa de Atividade aparece na segunda linha da coluna 3
- [ ] Títulos dos 4 KPIs verticais estão em `text-sm font-bold`
- [ ] Botão Notificações exibe texto + badge
- [ ] Botão Novo Lead exibe texto "Novo Lead"
- [ ] Sub-sidebar anima suavemente ao abrir/fechar (200-300ms)
- [ ] Layout responsivo mantém funcionamento em mobile
