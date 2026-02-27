# Analytics Enhancement Plan - Dashboard CRM

**Data**: 26 de Fevereiro de 2026  
**Status**: Corporate Design ✅ COMPLETO | Analytics Enhancement 🔄 EM ANDAMENTO

---

## 📋 Resumo Executivo

Transformação do dashboard CRM em plataforma de analytics AI-powered com sistema robusto de Tags e localização 100% em Português. Baseado em pesquisa de 35KB cobrindo tipografia corporativa, sistemas de tags enterprise, algoritmos de IA e melhores práticas de localização.

### Fases Concluídas ✅
- **Design Corporativo**: 8 arquivos modificados, gradient purple (#9795e4 → #b3b3e5), borders visíveis, rounded-sm, densidade aumentada
- **Pesquisa Técnica**: 1146 linhas cobrindo Inter typography, tag data models, AI algorithms, Portuguese terminology

### Próximas Fases (27-29h estimado)
- **Week 1 MVP**: 24h cobre fundação + features core (typography, Portuguese, tags, KPIs, charts)
- **Full Launch**: 3-4 dias de trabalho focado

---

## 🎨 Sistema de Design Corporativo (IMPLEMENTADO)

### Cores
```css
/* Primary - Client Purple Gradient */
--primary: #9795e4
--primary-gradient: linear-gradient(135deg, #9795e4 0%, #b3b3e5 100%)
--primary-dark: #7C6FD8
--primary-light: #E8E7F4

/* Enterprise Palette */
--success: #027E46 (verde corporativo)
--warning: #FFB75D (laranja sutil)
--error: #C23934 (vermelho profissional)
--border: #DDDBDA (cinza estrutural)
--bg-secondary: #F3F2F2 (fundo neutro)
```

### Borders & Spacing
- **Border Radius**: `--radius: 0.125rem` (2px) - `rounded-sm` em todos componentes
- **Borders**: `border-2` visível em cards, inputs, buttons
- **Density**: `p-4` e `gap-4` (reduzido de p-6/gap-6)

### Sidebar
- Background: `bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]`
- Ícones: `text-white` (100% contraste)
- Active: `bg-white/30 text-white`
- Hover: `bg-white/15`

---

## 🔤 Sistema de Tipografia (FASE 1 - 30min)

### Fonte: Inter (já instalada ✅)
**Por que Inter?**
- ⭐⭐⭐⭐⭐ (5/5) - Melhor para dashboards data-heavy
- Variable font (reduz tamanho de arquivo)
- Tabular numbers (números alinham verticalmente)
- 2000+ glyphs, 147 languages
- OpenType features para números profissionais

### Implementação
```typescript
// app/layout.tsx
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ['300', '400', '500', '600', '700'], // ADD
  display: 'swap' // ADD
})
```

```css
/* app/globals.css - Add to @layer base body */
font-feature-settings: 'tnum' 1, 'ss02' 1;
/* 'tnum' = tabular numbers (essential for KPIs)
   'ss02' = disambiguation (0 vs O, I vs l) */
```

### Weights Usage
- **Light 300**: Subheadings, descriptions
- **Regular 400**: Body text, labels
- **Medium 500**: Table headers, badges
- **Semibold 600**: Card titles, section headers
- **Bold 700**: KPI values, call-to-action

---

## 🇧🇷 Localização Portuguesa (FASE 2 - 1h)

### Princípios
1. **Use terminologia natural**: "Taxa de Conversão" (NOT "Índice de Conversão")
2. **Keep acronyms em inglês**: ROI, MRR, CAC, LTV, NPS (universalmente entendidos)
3. **Formatação BR**: R$ 5.420,50 (ponto milhar, vírgula decimal)

### Traduções Principais

| English | ❌ Evitar | ✅ Usar |
|---------|-----------|---------|
| Conversion Rate | Índice de Conversão | Taxa de Conversão |
| Average Deal Size | Valor Médio do Negócio | Ticket Médio |
| Won Deals | Deals Ganhos | Negócios Fechados |
| Lead Generation | Geração de Lead | Geração de Leads |
| Follow-up | Acompanhamento | Follow-up (keep) |
| Qualified Leads | Leads Qualificadas | Leads Qualificados |

### KPIs Dashboard

**Atuais (components/kpi-cards.tsx)**:
```typescript
// ❌ BEFORE
"NOVOS LEADS" → ✅ "Total de Leads"
"CONTATOS ATIVOS" → ✅ "Contatos Ativos"  
"TAXA DE CONVERSAO" → ✅ "Taxa de Conversão" (add ã)
"86.5%" → ✅ "86,5%" (comma decimal)
"DEALS GANHOS" → ✅ "Negócios Fechados"
```

**Chart Labels (components/lead-trends-chart.tsx)**:
```typescript
// ❌ BEFORE
"Lead Generation Trends" → ✅ "Tendência de Geração de Leads"
"Total Leads" → ✅ "Total de Leads"
"Verified" → ✅ "Verificados"
"Upcoming" → ✅ "Novos"
```

**Table Headers (components/recent-leads.tsx)**:
```typescript
"Recent Leads" → ✅ "Leads Recentes"
"valid" → ✅ "Válido"
"risky" → ✅ "Atenção"
```

### Formatação de Números

```typescript
// lib/formatters.ts (TO CREATE)
export const formatters = {
  currency: (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value), // R$ 5.420,50

  percentage: (value: number) => 
    `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1
    })}%`, // 3,8%

  number: (value: number) => 
    value.toLocaleString('pt-BR'), // 1.234 ou 1.234,56

  duration: (days: number) => 
    `${days} ${days === 1 ? 'dia' : 'dias'}`,

  relativeDate: (date: Date) => {
    // "Hoje", "Ontem", "Há 3 dias", "26/02/2026"
  }
}
```

---

## 🏷️ Sistema de Tags (FASE 3-4 - 5h)

### Data Model

```typescript
// lib/types/tag.ts (TO CREATE)

export type TagColor = 
  | "blue" | "green" | "yellow" | "orange" 
  | "red" | "purple" | "pink" | "gray"

export type TagCategory = 
  | "lead_source"      // Origem (Google Ads, LinkedIn, Indicação)
  | "industry"         // Indústria (SaaS, E-commerce, Educação)
  | "product_interest" // Interesse (Demo, Trial, Pricing)
  | "campaign"         // Campanha (Black Friday, Webinar Q1)
  | "lifecycle_stage"  // Estágio (Novo, Engajado, Qualificado)
  | "custom"           // Custom user-defined

export interface Tag {
  id: string
  name: string
  slug: string
  color: TagColor
  category: TagCategory
  createdAt: Date
  createdBy: string
  usageCount: number
}

export interface UTMParams {
  utm_source: string      // google, linkedin, email, direct
  utm_medium: string      // cpc, paid_social, email, organic
  utm_campaign?: string   // black-friday-2026, webinar-q1
  utm_content?: string    // ad-variant-a, cta-button
  utm_term?: string       // automation software, crm tool
}

export interface UTMTouchpoint extends UTMParams {
  timestamp: Date
  landingPage: string
}

export interface TagFilter {
  mode: "AND" | "OR"
  include: string[]  // tag IDs to include
  exclude?: string[] // tag IDs to exclude
}

export interface TagPerformance {
  tagName: string
  leadsCount: number
  conversionsCount: number
  conversionRate: number
  averageDealValue: number
  roi: number
}
```

### Contact Model Extensions

```typescript
// lib/types/contact.ts (UPDATE)
export interface Contact {
  // ... existing fields
  
  // Tag System
  tags: string[]           // manual tags
  autoTags?: string[]      // AI-generated tags
  
  // UTM Attribution
  firstTouch: UTMTouchpoint
  lastTouch: UTMTouchpoint
  touchpoints: UTMTouchpoint[]
  
  // AI Scoring
  leadScore?: number       // 0-100
  leadGrade?: 'A' | 'B' | 'C' | 'D'
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentimentScore?: number  // 0-100
}
```

### UI Components

**TagBadge** (components/ui/tag-badge.tsx):
```tsx
// Pill style: rounded-full px-2.5 py-0.5
<span className="
  inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
  bg-blue-100 text-blue-700
">
  Google Ads
  {removable && <X className="ml-1 h-3 w-3 cursor-pointer" />}
</span>
```

**TagSelector** (components/tag-selector.tsx):
```tsx
// 3-section dropdown:
// 1. Popular Tags (top 5 by usage)
// 2. All Tags (grouped by category)
// 3. Create New (input + color picker)
```

**TagFilter** (components/tag-filter.tsx):
```tsx
// AND/OR toggle + multi-select
// Include/Exclude mode
```

### Mock Tags (lib/mock-tags.ts)

**Lead Source** (6 tags):
- Google Ads (blue)
- LinkedIn (blue)
- Indicação (green)
- Orgânico (green)
- Instagram (pink)
- WhatsApp (green)

**Industry** (6 tags):
- SaaS (purple)
- E-commerce (orange)
- Educação (blue)
- Saúde (red)
- Financeiro (yellow)
- Consultoria (gray)

**Product Interest** (5 tags):
- Demo Solicitada (green)
- Trial Ativo (green)
- Página de Preços (yellow)
- Case Study (blue)
- Integração (purple)

**Campaign** (4 tags):
- Black Friday (orange)
- Webinar Q1 (blue)
- Lançamento Produto (purple)
- Email Nurture (gray)

**Lifecycle Stage** (5 tags):
- Novo (blue)
- Engajamento Baixo (gray)
- Engajamento Alto (green)
- Qualificado (green)
- Cliente (purple)

**Custom** (4 tags):
- VIP (yellow)
- Decisor (orange)
- C-Level (red)
- Orçamento Aprovado (green)

---

## 🤖 AI Features (FASE 8-10 - 8h)

### Lead Scoring Algorithm

```typescript
// lib/ai/lead-scoring.ts (TO CREATE)

export function calculateLeadScore(contact: Contact): {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  breakdown: ScoreBreakdown
} {
  const weights = {
    tags: 0.30,      // 30%
    utm: 0.15,       // 15%
    engagement: 0.25, // 25%
    sentiment: 0.15,  // 15%
    profile: 0.15     // 15%
  }
  
  // Tag Scoring Rules
  const tagScores = {
    // High Value
    'VIP': +15,
    'Decisor': +15,
    'C-Level': +20,
    'Enterprise': +15,
    'Orçamento Aprovado': +25,
    
    // Product Interest
    'Demo Solicitada': +20,
    'Trial Ativo': +15,
    'Página de Preços': +10,
    
    // Engagement
    'Engajamento Alto': +10,
    'Email Respondido': +5,
    
    // Negative
    'Fora do Perfil': -20,
    'Não Qualificado': -30,
    'Concorrente': -50
  }
  
  // UTM Scoring Rules
  const utmScores = {
    referral: +10,
    direct: +15,
    paid_social: +5,
    email: +8,
    organic: +7,
    display: +3
  }
  
  // Calculate weighted total (0-100)
  const total = Math.max(0, Math.min(100,
    (tagScore * weights.tags) +
    (utmScore * weights.utm) +
    (engagementScore * weights.engagement) +
    (sentimentScore * weights.sentiment) +
    (profileScore * weights.profile)
  ))
  
  // Assign grade
  const grade = 
    total >= 80 ? 'A' :
    total >= 60 ? 'B' :
    total >= 40 ? 'C' : 'D'
  
  return { score: total, grade, breakdown }
}
```

### Sentiment Analysis

```typescript
// lib/ai/sentiment-analyzer.ts (TO CREATE)

const POSITIVE_KEYWORDS = [
  'ótimo', 'perfeito', 'adorei', 'concordo',
  'vamos fechar', 'me convenceu'
]

const NEGATIVE_KEYWORDS = [
  'caro', 'não tenho', 'preciso pensar',
  'talvez', 'não é o momento', 'muito investimento'
]

export function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // 0-100
  keywords: { word: string, type: 'positive' | 'negative' }[]
} {
  const lower = text.toLowerCase()
  
  const positiveMatches = POSITIVE_KEYWORDS.filter(kw => lower.includes(kw))
  const negativeMatches = NEGATIVE_KEYWORDS.filter(kw => lower.includes(kw))
  
  const balance = positiveMatches.length - negativeMatches.length
  
  const score = Math.max(0, Math.min(100, 50 + (balance * 10)))
  
  const sentiment = 
    score >= 60 ? 'positive' :
    score >= 40 ? 'neutral' : 'negative'
  
  return { sentiment, score, keywords: [...] }
}
```

### Objection Detection

```typescript
// lib/ai/objection-detector.ts (TO CREATE)

export type ObjectionCategory = 
  | 'Preço'
  | 'Timing'
  | 'Concorrência'
  | 'Features'
  | 'Autoridade'

const OBJECTION_PATTERNS = {
  'Preço': [
    'caro', 'preço alto', 'não tenho orçamento',
    'muito investimento', 'valor elevado'
  ],
  'Timing': [
    'não é o momento', 'talvez depois', 'preciso pensar',
    'ano que vem', 'próximo trimestre'
  ],
  'Concorrência': [
    'já temos outro', 'comparando opções',
    'olhando concorrentes', 'proposta do X'
  ],
  'Features': [
    'falta funcionalidade', 'não tem integração',
    'preciso de X', 'vocês não oferecem'
  ],
  'Autoridade': [
    'não sou eu quem decide', 'preciso consultar',
    'falar com meu chefe', 'depende do time'
  ]
}

export function extractObjections(transcript: string): {
  category: ObjectionCategory
  text: string
  timestamp?: string
}[] {
  // Detect objection patterns in transcript
  // Return array of objections with context
}
```

### UTM Attribution Models

```typescript
// 5 models implemented

// 1. First-Touch: 100% credit to first visit
// 2. Last-Touch: 100% credit to last visit
// 3. Linear: Equal distribution across all touchpoints
// 4. U-Shaped: 40% first + 40% last + 20% middle
// 5. Time-Decay: More recent = more credit
```

---

## 📊 New KPIs & Charts

### Advanced KPIs (components/advanced-kpis.tsx)

1. **Pipeline Total**: R$ 245.600 (soma de todos deals)
2. **Ticket Médio**: R$ 5.420 (deal value médio)
3. **Tempo Conversão**: 18 dias (lead → cliente)
4. **Lead Score Médio**: 68 (média score 0-100)

### Conversion Funnel (components/conversion-funnel-chart.tsx)

6 stages com drop-off %:
1. **Visitante**: 5.420 (100%)
2. **Lead**: 1.284 (23.7%) ↓ -76.3%
3. **Qualificado**: 542 (10%) ↓ -13.7%
4. **Oportunidade**: 234 (4.3%) ↓ -5.7%
5. **Proposta**: 89 (1.6%) ↓ -2.7%
6. **Fechado**: 34 (0.6%) ↓ -1%

### Tag Performance Chart (components/tag-performance-chart.tsx)

Horizontal bar - top 10 tags by conversion rate:
- "VIP" → 45% (20 leads, 9 conversions)
- "Demo Solicitada" → 38% (150 leads, 57 conversions)
- "Orçamento Aprovado" → 35% (30 leads, 10 conversions)

### Activity Heatmap (components/activity-heatmap.tsx)

7×24 grid showing:
- **Best times**: Terça 10h-12h, Quinta 14h-16h
- **Worst times**: Weekend, Sexta após 17h
- Color intensity: 0 interactions (gray) → 50+ (purple)

### Objections Chart (components/objections-chart.tsx)

Top 5 objeções:
1. **Preço** (42 mentions, 24% taxa conversão, 8 dias tempo resolução)
2. **Timing** (38 mentions, 18% taxa conversão)
3. **Features** (24 mentions, 32% taxa conversão)
4. **Autoridade** (18 mentions, 28% taxa conversão)
5. **Concorrência** (12 mentions, 15% taxa conversão)

---

## 🎯 Implementation Roadmap

### Week 1 - MVP (24h total)

**Day 1 - Foundation (8h)**
- ✅ Phase 1: Inter typography OpenType (30min)
- ✅ Phase 2: Portuguese translation (1h)
- ✅ Phase 3: Tag data model (2h)
- ✅ Phase 4: Tag UI components (3h)
- ✅ Phase 11: Mock data enriched (1.5h)

**Day 2 - Core Features (8h)**
- ✅ Phase 5: Advanced KPIs (2h)
- ✅ Phase 6: Conversion funnel chart (2.5h)
- ✅ Phase 7: Tag performance chart (2h)
- ✅ Phase 12: Layout updates (1.5h)

**Day 3 - AI Features (8h)**
- ✅ Phase 8: Objections detection + chart (3h)
- ✅ Phase 9: Activity heatmap (2.5h)
- ✅ Phase 10: AI insights panel (2.5h)

### Week 2 - Full Launch (5h remaining)

**Day 4 - Polish (3h)**
- ✅ Phase 13: Utility functions (1h)
- ✅ Phase 14: Tag management UI (2h)

**Day 5 - QA (2h)**
- ✅ Phase 15: Testing (1h)
- ✅ Phase 16: Documentation (1h)

---

## 📚 Files to Create

### Types & Models
- [ ] `lib/types/tag.ts` (8 interfaces)
- [ ] `lib/types/contact.ts` (extend existing)
- [ ] `lib/mock-tags.ts` (25-30 tags)
- [ ] `lib/mock-leads-enriched.ts` (25 leads)
- [ ] `lib/mock-transcriptions.ts` (15-20 Portuguese transcripts)
- [ ] `lib/mock-ai-insights.ts` (predictions/alerts/recommendations)

### AI Utilities
- [ ] `lib/ai/lead-scoring.ts`
- [ ] `lib/ai/sentiment-analyzer.ts`
- [ ] `lib/ai/objection-detector.ts`

### General Utilities
- [ ] `lib/formatters.ts` (BR locale)
- [ ] `lib/tag-utils.ts` (color mapping, filtering)

### Components
- [ ] `components/ui/tag-badge.tsx`
- [ ] `components/tag-selector.tsx`
- [ ] `components/tag-filter.tsx`
- [ ] `components/advanced-kpis.tsx`
- [ ] `components/conversion-funnel-chart.tsx`
- [ ] `components/tag-performance-chart.tsx`
- [ ] `components/utm-attribution-chart.tsx`
- [ ] `components/activity-heatmap.tsx`
- [ ] `components/objections-chart.tsx`
- [ ] `components/ai-insights-panel.tsx`

### Pages
- [ ] `app/tags/page.tsx` (tag management)

### Documentation
- [ ] `docs/tag-system.md`
- [ ] `docs/ai-features.md`

---

## 🚀 Quick Start

**Immediate next steps**:
```bash
# Phase 1-2: Typography + Portuguese (1.5h)
# 1. Update app/layout.tsx (add weights + display)
# 2. Update app/globals.css (add font-feature-settings)
# 3. Update components/kpi-cards.tsx (4 labels)
# 4. Update components/lead-trends-chart.tsx (4 labels)
# 5. Update components/recent-leads.tsx (2 labels)
```

---

**Documento criado em**: 26/02/2026  
**Última atualização**: 26/02/2026  
**Versão**: 1.0  
**Status**: 🟢 Ready to implement
