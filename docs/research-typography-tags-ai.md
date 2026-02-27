# Research Report: Typography, Tags & AI Features

**Data da Pesquisa**: 26 de Fevereiro de 2026  
**Escopo**: Corporate Sans Serif Typography, CRM Tag Systems, AI Integration, Portuguese Localization  
**Total**: 1146 linhas de análise técnica

---

## 🔤 Section 1: Corporate Typography Analysis

### Methodology
Análise comparativa de 8 fontes Sans Serif corporativas considerando:
- Características técnicas (weights, glyphs, OpenType features)
- Appeal corporativo (profissionalismo, densidade, clareza)
- Performance (file size, rendering, loading)
- Pairing & ecosystem
- Dashboard suitability (tabular numbers, disambiguation)

---

### Font Rankings

#### 🥇 #1 - Inter (⭐⭐⭐⭐⭐)

**Why Inter is #1 for dashboards:**
- **Variable font**: Single file covers all weights (100-900)
- **Tabular numbers**: OpenType 'tnum' feature aligns numbers vertically (essential for KPIs)
- **Disambiguation**: 'ss02' feature improves clarity (0 vs O, I vs l, 1 vs l)
- **Optical sizing**: Automatic adjustments for different sizes
- **2000+ glyphs**: Supports 147 languages including Portuguese special characters (ã, ç, ê, õ)
- **Open Source**: Google Fonts, free for commercial use

**Corporate Appeal**: ★★★★★
- Tags: "Professional", "Modern", "Trustworthy", "Data-Focused"
- Used by: Notion, Linear, Vercel, GitHub, Stripe
- Perfect for: Financial dashboards, analytics, data-heavy UIs

**Weights Available**:
- Thin 100, Extra Light 200, Light 300
- Regular 400, Medium 500
- Semi Bold 600, Bold 700
- Extra Bold 800, Black 900
- All with italics

**OpenType Features**:
```css
font-feature-settings: 
  'tnum' 1,  /* Tabular numbers - CRITICAL for dashboards */
  'ss02' 1,  /* Disambiguation - improves clarity */
  'case' 1,  /* Case sensitive forms */
  'liga' 1;  /* Standard ligatures */
```

**Google Fonts URL**:
```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap
```

**Implementation**:
```typescript
// next.config.js or app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
})
```

**Best Pairing**: Inter + IBM Plex Mono (for code blocks)

---

#### 🥈 #2 - IBM Plex Sans (⭐⭐⭐⭐⭐)

**Corporate DNA**: Designed by IBM for enterprise software
- **Neo Grotesque**: Geometric but humanist touches
- **Superellipse construction**: Unique curves (not pure circles)
- **Enterprise pedigree**: IBM's official typeface since 2017

**Corporate Appeal**: ★★★★★
- Tags: "Business", "Competent", "Calm", "Technology"
- Used by: IBM Watson, Carbon Design System
- Perfect for: B2B SaaS, consulting firms, financial services

**Weights**: Thin 100, Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700

**Why #2 not #1?**
- Slightly less optimized for dashboards (no 'tnum' feature)
- Heavier file size (not variable font)
- More formal/cold vs Inter's balanced warmth

---

#### 🥉 #3 - Roboto (⭐⭐⭐⭐)

**Universal Recognition**: Google Material Design default
- 12+ weights, massive glyph coverage
- Extremely familiar (used on Android, Google products)
- Neo Grotesque, clean, mechanical

**Corporate Appeal**: ★★★★
- May feel "too Google" for non-Google products
- Professional but lacks uniqueness
- Better for consumer products vs B2B

---

### Other Fonts Analyzed

**SF Pro (Apple)**: Restricted licensing, macOS/iOS only  
**Segoe UI (Microsoft)**: Windows default, limited web availability  
**Roboto**: Too ubiquitous, lacks differentiation  
**Open Sans**: Outdated (2010), superseded by newer alternatives  
**Work Sans**: Too geometric, lacks warmth  
**DM Sans**: Good for marketing, too casual for dashboards

---

### Final Recommendation: Inter

**Rationale**:
1. ✅ **Already installed** in project (app/layout.tsx line 5)
2. ✅ **Tabular numbers** via 'tnum' (numbers align in columns)
3. ✅ **Variable font** (performance + flexibility)
4. ✅ **Corporate proven** (Stripe, GitHub, Notion use it)
5. ✅ **Portuguese support** (ã, ç, ê, õ all included)
6. ✅ **Dashboard optimized** (designed for data-heavy UIs)

**Implementation Priority**: HIGH (Phase 1, 30min)
- Add weights array: `['300','400','500','600','700']`
- Add display: `'swap'`
- Enable OpenType features in globals.css: `font-feature-settings: 'tnum' 1, 'ss02' 1;`

---

## 🏷️ Section 2: Tag Systems in CRMs

### Platform Analysis

#### Salesforce
**Implementation**:
- Topics (max 25 per record)
- Multi-select picklists (admin-defined values)
- Color-coded pills in UI
- API: TopicAssignment object

**UI Pattern**: `<span className="pill bg-blue-500">Enterprise</span>`

**Features**:
- Trending topics dashboard
- Topic-based reports
- Einstein AI suggests topics
- Permission control (public/private topics)

---

#### HubSpot
**Implementation**:
- Unlimited tags per contact/company/deal
- Inline autocomplete (type to add)
- Automatic color assignment (8 colors rotate)
- Workflow triggers based on tags
- Tag performance reports

**UI Pattern**: Inline editable field with tag pills

**Features**:
- Tag-based lists (saved filters)
- UTM properties built-in (5 standard fields)
- Tag history (audit trail)
- Bulk tag actions

---

#### Pipedrive
**Implementation**:
- Color-coded labels (8 preset colors)
- Unlimited tags
- Filter combinations (AND/OR)
- Bulk actions

**UI Pattern**: Colored badges in cards

**Features**:
- Label performance metrics
- Deal value by label
- Conversion rate by label

---

### UTM Tracking Standard

**5 Parameters**:
```typescript
interface UTMParams {
  utm_source: string    // google, linkedin, email, direct
  utm_medium: string    // cpc, paid_social, email, organic, referral
  utm_campaign?: string // black-friday-2026, webinar-q1
  utm_content?: string  // ad-variant-a, cta-button
  utm_term?: string     // automation software, crm tool
}
```

**Naming Conventions**:
- Lowercase only
- Use underscores (not spaces or hyphens)
- Consistent medium values: cpc, paid_social, email, social, referral, display, organic, direct, offline

**Medium Standard Values**:
- `cpc`: Paid search (Google Ads, Bing Ads)
- `paid_social`: Paid social media (Facebook Ads, LinkedIn Ads)
- `email`: Email campaigns
- `social`: Organic social media
- `referral`: Partner/affiliate links
- `display`: Display advertising
- `organic`: Organic search (SEO)
- `direct`: Direct traffic (type URL, bookmark)
- `offline`: Offline campaigns (QR codes, print)

---

### Data Model Design

```typescript
// lib/types/tag.ts

export type TagColor = 
  | "blue"    // Trust, professional (empresas SaaS, tech)
  | "green"   // Success, growth (indicações, qualificados)
  | "yellow"  // Warning, attention (pricing page views, VIP)
  | "orange"  // Energy, campaigns (promoções, urgência)
  | "red"     // Urgency, high value (C-level, enterprise)
  | "purple"  // Premium, exclusive (Trial ativo, demos)
  | "pink"    // Social, creative (social media sources)
  | "gray"    // Neutral, informational (lifecycle stages)

export type TagCategory = 
  | "lead_source"      // Where lead came from
  | "industry"         // Vertical/sector
  | "product_interest" // What they're interested in
  | "campaign"         // Marketing campaign
  | "lifecycle_stage"  // Position in funnel
  | "custom"           // User-defined

export interface Tag {
  id: string
  name: string          // "Enterprise"
  slug: string          // "enterprise"
  color: TagColor
  category: TagCategory
  createdAt: Date
  createdBy: string     // user ID
  usageCount: number    // how many contacts have this tag
}

export interface UTMTouchpoint extends UTMParams {
  timestamp: Date
  landingPage: string   // "/pricing", "/demo"
}

export interface Contact {
  // ... existing fields
  
  tags: string[]        // manual tags (array of tag IDs)
  autoTags?: string[]   // AI-suggested tags
  
  // UTM Attribution
  firstTouch: UTMTouchpoint    // first visit
  lastTouch: UTMTouchpoint     // most recent visit
  touchpoints: UTMTouchpoint[] // all visits
  
  // AI Enrichment
  leadScore?: number           // 0-100
  leadGrade?: 'A' | 'B' | 'C' | 'D'
  sentiment?: 'positive' | 'neutral' | 'negative'
  sentimentScore?: number      // 0-100
}

export interface TagFilter {
  mode: "AND" | "OR"
  include: string[]     // tag IDs to include
  exclude?: string[]    // tag IDs to exclude
}

export interface TagPerformance {
  tagName: string
  leadsCount: number
  conversionsCount: number
  conversionRate: number        // 0.38 = 38%
  averageDealValue: number      // R$ 5,420
  averageSalesCycle: number     // 18 days
  roi: number                   // 4.2x
}
```

---

### UI Patterns

**1. Pill Style** (Recommended):
```html
<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
  Google Ads
  <X class="ml-1 h-3 w-3 cursor-pointer hover:text-blue-900" />
</span>
```

**2. Badge Style**:
```html
<span class="inline-flex items-center rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-green-500 text-white">
  Qualificado
</span>
```

**3. Chip Style** (Material Design):
```html
<div class="inline-flex items-center gap-2 rounded-sm border-2 border-purple-500 bg-white px-3 py-1.5 text-sm text-purple-700">
  <div class="h-2 w-2 rounded-full bg-purple-500"></div>
  VIP Customer
</div>
```

**4. Color-Coded List**:
```html
<div class="flex items-center gap-2 border-l-2 border-orange-500 pl-2">
  <span class="text-sm text-foreground">Black Friday Campaign</span>
</div>
```

---

### Tag Selector Component

**3-Section Dropdown**:

```
┌─────────────────────────────┐
│ [Input: Type to filter...]  │
├─────────────────────────────┤
│ 📌 Popular Tags              │
│ • Google Ads (1,234)        │
│ • Demo Solicitada (842)     │
│ • Enterprise (456)          │
├─────────────────────────────┤
│ 📂 All Tags                  │
│ ▼ Lead Source               │
│   • Google Ads              │
│   • LinkedIn                │
│   • Indicação               │
│ ▼ Industry                  │
│   • SaaS                    │
│   • E-commerce              │
├─────────────────────────────┤
│ ➕ Create New Tag            │
│ [Input: Tag name...]        │
│ [Color picker: ⚫🔵🟢🟡]     │
└─────────────────────────────┘
```

**Behavior**:
- Autocomplete as user types
- Show usage count next to each tag
- Click to toggle (selected tags show checkmark)
- Drag to reorder selected tags
- Max 20 tags recommended per contact

---

### Filtering Logic

```typescript
// AND mode: Contact must have ALL selected tags
function filterContactsAND(contacts: Contact[], tagIds: string[]): Contact[] {
  return contacts.filter(contact => 
    tagIds.every(tagId => contact.tags.includes(tagId))
  )
}

// OR mode: Contact must have ANY selected tag
function filterContactsOR(contacts: Contact[], tagIds: string[]): Contact[] {
  return contacts.filter(contact =>
    tagIds.some(tagId => contact.tags.includes(tagId))
  )
}

// Exclude mode: Contact must NOT have excluded tags
function filterContactsExclude(contacts: Contact[], excludeIds: string[]): Contact[] {
  return contacts.filter(contact =>
    !excludeIds.some(tagId => contact.tags.includes(tagId))
  )
}

// Combined filter
function filterContacts(contacts: Contact[], filter: TagFilter): Contact[] {
  let filtered = contacts

  // Apply include filter
  if (filter.include.length > 0) {
    filtered = filter.mode === "AND"
      ? filterContactsAND(filtered, filter.include)
      : filterContactsOR(filtered, filter.include)
  }

  // Apply exclude filter
  if (filter.exclude && filter.exclude.length > 0) {
    filtered = filterContactsExclude(filtered, filter.exclude)
  }

  return filtered
}
```

---

### Best Practices

**Tag Naming**:
- Use nouns (not verbs): "Enterprise" not "Is Enterprise"
- Capitalize first letter: "Demo Solicitada"
- Keep short: Max 20 characters
- Be specific: "Google Ads Search" not "Online"

**Tag Hygiene**:
- Merge duplicates: "VIP" + "VIP Customer" → "VIP"
- Archive unused tags: < 5 uses in 90 days
- Standardize naming: "C-Level" not "C Level" or "CLevel"
- Limit total tags: 50-100 active tags maximum

**Tag Governance**:
- Define categories clearly
- Restrict who can create tags (admin only vs all users)
- Periodic review (quarterly)
- Document tag meanings

---

## 🤖 Section 3: AI + Tags Integration

### Lead Scoring Algorithm

```typescript
// lib/ai/lead-scoring.ts

interface ScoreBreakdown {
  tags: number          // 0-30 points
  utm: number           // 0-15 points
  engagement: number    // 0-25 points
  sentiment: number     // 0-15 points
  profile: number       // 0-15 points
  total: number         // 0-100 points
}

export function calculateLeadScore(contact: Contact): {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  breakdown: ScoreBreakdown
} {
  // 1. Tag Score (30% weight)
  const tagWeights: Record<string, number> = {
    // High Value (15-25 points)
    'VIP': 15,
    'Decisor': 15,
    'C-Level': 20,
    'Enterprise': 15,
    'Orçamento Aprovado': 25,
    
    // Product Interest (10-20 points)
    'Demo Solicitada': 20,
    'Trial Ativo': 15,
    'Página de Preços': 10,
    'Case Study Download': 12,
    'Integração Solicitada': 15,
    
    // Engagement (5-10 points)
    'Engajamento Alto': 10,
    'Email Respondido': 5,
    'LinkedIn Conectado': 8,
    'Participou Webinar': 12,
    
    // Negative Signals (-20 to -50)
    'Fora do Perfil': -20,
    'Não Qualificado': -30,
    'Concorrente': -50,
    'Freelancer': -10,
    'Estudante': -15
  }
  
  let tagScore = 0
  contact.tags.forEach(tagId => {
    const tag = getTagById(tagId)
    tagScore += tagWeights[tag.name] || 0
  })
  // Normalize to 0-30 scale
  tagScore = Math.max(0, Math.min(30, tagScore))
  
  
  // 2. UTM Score (15% weight)
  const utmMediumWeights: Record<string, number> = {
    'referral': 10,      // Partner/customer referrals
    'direct': 15,        // Direct traffic (brand awareness)
    'paid_social': 5,    // Paid social ads
    'email': 8,          // Email campaigns
    'organic': 7,        // Organic search (intent)
    'cpc': 6,            // Paid search
    'display': 3,        // Display ads (awareness)
    'social': 4          // Organic social
  }
  
  let utmScore = 0
  if (contact.lastTouch) {
    utmScore = utmMediumWeights[contact.lastTouch.utm_medium] || 0
  }
  // Normalize to 0-15 scale
  utmScore = Math.max(0, Math.min(15, utmScore))
  
  
  // 3. Engagement Score (25% weight)
  const engagementMetrics = {
    emailOpens: contact.emailOpens || 0,
    emailClicks: contact.emailClicks || 0,
    websiteVisits: contact.touchpoints?.length || 0,
    formSubmissions: contact.formSubmissions || 0,
    callsCompleted: contact.callsCompleted || 0
  }
  
  let engagementScore = 
    (engagementMetrics.emailOpens * 0.5) +
    (engagementMetrics.emailClicks * 2) +
    (engagementMetrics.websiteVisits * 1) +
    (engagementMetrics.formSubmissions * 5) +
    (engagementMetrics.callsCompleted * 10)
  
  // Normalize to 0-25 scale
  engagementScore = Math.max(0, Math.min(25, engagementScore))
  
  
  // 4. Sentiment Score (15% weight)
  let sentimentScore = 0
  if (contact.sentimentScore !== undefined) {
    // Convert 0-100 sentiment to 0-15 scale
    sentimentScore = (contact.sentimentScore / 100) * 15
  }
  
  
  // 5. Profile Score (15% weight)
  let profileScore = 0
  
  // Company size
  if (contact.companySize >= 500) profileScore += 8
  else if (contact.companySize >= 100) profileScore += 5
  else if (contact.companySize >= 20) profileScore += 3
  
  // Job title
  const titleKeywords = {
    ceo: 5, founder: 5, president: 5, owner: 5,
    vp: 4, director: 4, head: 4,
    manager: 3, lead: 3,
    analyst: 1, specialist: 1
  }
  const title = (contact.jobTitle || '').toLowerCase()
  Object.entries(titleKeywords).forEach(([keyword, points]) => {
    if (title.includes(keyword)) profileScore += points
  })
  
  // Industry match
  const targetIndustries = ['SaaS', 'E-commerce', 'Tech', 'Financeiro']
  if (contact.industry && targetIndustries.includes(contact.industry)) {
    profileScore += 2
  }
  
  // Normalize to 0-15 scale
  profileScore = Math.max(0, Math.min(15, profileScore))
  
  
  // Calculate total (0-100)
  const total = Math.round(
    tagScore + utmScore + engagementScore + sentimentScore + profileScore
  )
  
  // Assign grade
  const grade = 
    total >= 80 ? 'A' :  // Hot leads
    total >= 60 ? 'B' :  // Warm leads
    total >= 40 ? 'C' :  // Cool leads
    'D'                  // Cold leads
  
  return {
    score: total,
    grade,
    breakdown: {
      tags: tagScore,
      utm: utmScore,
      engagement: engagementScore,
      sentiment: sentimentScore,
      profile: profileScore,
      total
    }
  }
}
```

---

### Sentiment Analysis (MVP - Keyword Based)

```typescript
// lib/ai/sentiment-analyzer.ts

const POSITIVE_KEYWORDS = [
  // Enthusiastic
  'ótimo', 'perfeito', 'adorei', 'excelente', 'maravilhoso',
  
  // Agreement
  'concordo', 'sim', 'claro', 'com certeza', 'sem dúvida',
  
  // Interest
  'interessante', 'legal', 'gostei', 'bacana',
  
  // Commitment
  'vamos fechar', 'me convenceu', 'pode enviar', 'quero contratar',
  'vamos em frente', 'topo', 'fechado',
  
  // Positive evaluation
  'melhor que', 'superior', 'completo', 'robusto'
]

const NEGATIVE_KEYWORDS = [
  // Price objections
  'caro', 'preço alto', 'muito investimento', 'valor elevado',
  
  // Hesitation
  'não tenho certeza', 'preciso pensar', 'talvez', 'não sei',
  'vou analisar', 'preciso ver',
  
  // Timing objections
  'não é o momento', 'não é agora', 'quem sabe depois',
  'ano que vem', 'próximo trimestre',
  
  // Capability concerns
  'falta', 'não tem', 'vocês não oferecem', 'preciso de',
  
  // Dismissive
  'não me interessa', 'não vejo valor', 'não preciso',
  'já temos', 'não serve'
]

export function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // 0-100
  confidence: number // 0-1
  keywords: { word: string, type: ' positive' | 'negative', context: string }[]
} {
  const lowerText = text.toLowerCase()
  
  // Find all keyword matches
  const positiveMatches: string[] = []
  const negativeMatches: string[] = []
  
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveMatches.push(keyword)
    }
  })
  
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeMatches.push(keyword)
    }
  })
  
  // Calculate balance
  const positiveCount = positiveMatches.length
  const negativeCount = negativeMatches.length
  const balance = positiveCount - negativeCount
  
  // Score: 0 (most negative) to 100 (most positive)
  // Base is 50 (neutral), each keyword moves ±10 points
  const rawScore = 50 + (balance * 10)
  const score = Math.max(0, Math.min(100, rawScore))
  
  // Determine sentiment category
  let sentiment: 'positive' | 'neutral' | 'negative'
  if (score >= 60) sentiment = 'positive'
  else if (score >= 40) sentiment = 'neutral'
  else sentiment = 'negative'
  
  // Confidence based on keyword count
  const totalKeywords = positiveCount + negativeCount
  const confidence = Math.min(1, totalKeywords * 0.2) // 0.2 per keyword, max 1.0
  
  // Extract keyword contexts
  const keywords = []
  positiveMatches.forEach(word => {
    const index = lowerText.indexOf(word)
    const context = text.substring(Math.max(0, index - 30), Math.min(text.length, index + word.length + 30))
    keywords.push({ word, type: 'positive' as const, context })
  })
  negativeMatches.forEach(word => {
    const index = lowerText.indexOf(word)
    const context = text.substring(Math.max(0, index - 30), Math.min(text.length, index + word.length + 30))
    keywords.push({ word, type: 'negative' as const, context })
  })
  
  return { sentiment, score, confidence, keywords }
}
```

---

### Objection Detection

```typescript
// lib/ai/objection-detector.ts

export type ObjectionCategory = 
  | 'Preço'
  | 'Timing'
  | 'Concorrência'
  | 'Features'
  | 'Autoridade'

interface ObjectionPattern {
  category: ObjectionCategory
  keywords: string[]
  severity: 'low' | 'medium' | 'high'
}

const OBJECTION_PATTERNS: ObjectionPattern[] = [
  {
    category: 'Preço',
    keywords: [
      'caro', 'preço alto', 'não tenho orçamento', 'muito investimento',
      'valor elevado', 'não cabe no orçamento', 'fora do budget',
      'precisa ser mais barato', 'desconto', 'mais em conta'
    ],
    severity: 'high'
  },
  {
    category: 'Timing',
    keywords: [
      'não é o momento', 'talvez depois', 'preciso pensar',
      'ano que vem', 'próximo trimestre', 'não é agora',
      'quem sabe mais tarde', 'vou deixar pra depois'
    ],
    severity: 'medium'
  },
  {
    category: 'Concorrência',
    keywords: [
      'já temos outro', 'comparando opções', 'olhando concorrentes',
      'proposta do', 'outro fornecedor', 'já uso', 'satisfeito com'
    ],
    severity: 'high'
  },
  {
    category: 'Features',
    keywords: [
      'falta funcionalidade', 'não tem integração', 'preciso de',
      'vocês não oferecem', 'não faz', 'não consegue',
      'limitado', 'não suporta'
    ],
    severity: 'medium'
  },
  {
    category: 'Autoridade',
    keywords: [
      'não sou eu quem decide', 'preciso consultar', 'falar com meu chefe',
      'depende do time', 'decisão não é minha', 'preciso de aprovação',
      'tem que passar por', 'não tenho autonomia'
    ],
    severity: 'low'
  }
]

export interface DetectedObjection {
  category: ObjectionCategory
  severity: 'low' | 'medium' | 'high'
  text: string
  timestamp?: string
  context: string
  confidence: number
}

export function extractObjections(transcript: string): DetectedObjection[] {
  const objections: DetectedObjection[] = []
  const lowerTranscript = transcript.toLowerCase()
  
  // Split transcript into sentences
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  OBJECTION_PATTERNS.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      if (lowerTranscript.includes(keyword)) {
        // Find the sentence containing this keyword
        const matchingSentence = sentences.find(s => 
          s.toLowerCase().includes(keyword)
        )
        
        if (matchingSentence) {
          objections.push({
            category: pattern.category,
            severity: pattern.severity,
            text: keyword,
            context: matchingSentence.trim(),
            confidence: 0.8 // Keyword-based detection has decent confidence
          })
        }
      }
    })
  })
  
  return objections
}

// Calculate objection resolution metrics
export function calculateObjectionMetrics(deals: Deal[]): {
  category: ObjectionCategory
  count: number
  conversionRate: number
  averageTimeToResolve: number // days
}[] {
  const metrics: Record<ObjectionCategory, {
    count: number
    resolved: number
    totalDays: number
  }> = {
    'Preço': { count: 0, resolved: 0, totalDays: 0 },
    'Timing': { count: 0, resolved: 0, totalDays: 0 },
    'Concorrência': { count: 0, resolved: 0, totalDays: 0 },
    'Features': { count: 0, resolved: 0, totalDays: 0 },
    'Autoridade': { count: 0, resolved: 0, totalDays: 0 }
  }
  
  deals.forEach(deal => {
    deal.objections?.forEach(objection => {
      metrics[objection.category].count++
      
      if (deal.status === 'won') {
        metrics[objection.category].resolved++
        
        // Calculate days from objection to close
        if (objection.timestamp && deal.closedAt) {
          const days = Math.floor(
            (deal.closedAt.getTime() - new Date(objection.timestamp).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
          metrics[objection.category].totalDays += days
        }
      }
    })
  })
  
  return Object.entries(metrics).map(([category, data]) => ({
    category: category as ObjectionCategory,
    count: data.count,
    conversionRate: data.count > 0 ? data.resolved / data.count : 0,
    averageTimeToResolve: data.resolved > 0 ? data.totalDays / data.resolved : 0
  }))
}
```

---

### Auto-Tagging from Conversations

```typescript
// lib/ai/auto-tagger.ts

interface TagSuggestion {
  tagId: string
  tagName: string
  confidence: number // 0-1
  reason: string
}

const TOPIC_PATTERNS = {
  'Demo Solicitada': [
    'quero ver uma demo', 'pode me mostrar', 'demonstração',
    'como funciona na prática', 'gostaria de testar'
  ],
  'Página de Preços': [
    'quanto custa', 'qual o preço', 'valores', 'planos',
    'investimento', 'tabela de preços'
  ],
  'Integração': [
    'integra com', 'conecta com', 'api', 'webhook',
    'sincronização', 'importar dados'
  ],
  'Suporte': [
    'suporte técnico', 'ajuda', 'problema', 'erro',
    'não está funcionando', 'como faço para'
  ],
  'Enterprise': [
    'equipe grande', 'muitos usuários', 'mais de', 'empresa grande',
    'corporativo', 'contrato anual'
  ]
}

const URGENCY_PATTERNS = {
  'high': [
    'urgente', 'preciso agora', 'o quanto antes', 'imediato',
    'prazo apertado', 'já deveria ter começado'
  ],
  'medium': [
    'semana que vem', 'próximos dias', 'até o final do mês',
    'breve', 'em breve'
  ],
  'low': [
    'sem pressa', 'quando possível', 'não tem urgência',
    'vou analisar com calma'
  ]
}

export function suggestTags(
  conversation: string,
  existingTags: Tag[]
): TagSuggestion[] {
  const suggestions: TagSuggestion[] = []
  const lowerConv = conversation.toLowerCase()
  
  // Detect topics
  Object.entries(TOPIC_PATTERNS).forEach(([tagName, patterns]) => {
    const matchCount = patterns.filter(pattern => 
      lowerConv.includes(pattern)
    ).length
    
    if (matchCount > 0) {
      const tag = existingTags.find(t => t.name === tagName)
      if (tag) {
        suggestions.push({
          tagId: tag.id,
          tagName: tag.name,
          confidence: Math.min(1, matchCount * 0.3),
          reason: `Mentioned ${matchCount} related keyword${matchCount > 1 ? 's' : ''}`
        })
      }
    }
  })
  
  // Detect urgency
  Object.entries(URGENCY_PATTERNS).forEach(([urgency, patterns]) => {
    const matchCount = patterns.filter(pattern =>
      lowerConv.includes(pattern)
    ).length
    
    if (matchCount > 0) {
      const tagName = urgency === 'high' ? 'Urgente' : 
                     urgency === 'medium' ? 'Prazo Médio' : 'Sem Urgência'
      const tag = existingTags.find(t => t.name === tagName)
      if (tag) {
        suggestions.push({
          tagId: tag.id,
          tagName: tag.name,
          confidence: Math.min(1, matchCount * 0.4),
          reason: `${urgency} urgency detected`
        })
      }
    }
  })
  
  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}
```

---

### UTM Attribution Models

```typescript
// lib/ai/utm-attribution.ts

export type AttributionModel = 
  | 'first-touch'
  | 'last-touch'
  | 'linear'
  | 'u-shaped'
  | 'time-decay'

export interface AttributionCredit {
  touchpoint: UTMTouchpoint
  credit: number // 0-1 (percentage)
}

export function calculateAttribution(
  touchpoints: UTMTouchpoint[],
  model: AttributionModel
): AttributionCredit[] {
  if (touchpoints.length === 0) return []
  if (touchpoints.length === 1) {
    return [{ touchpoint: touchpoints[0], credit: 1.0 }]
  }
  
  switch (model) {
    case 'first-touch':
      // 100% credit to first touchpoint
      return touchpoints.map((tp, i) => ({
        touchpoint: tp,
        credit: i === 0 ? 1.0 : 0
      }))
    
    case 'last-touch':
      // 100% credit to last touchpoint
      return touchpoints.map((tp, i) => ({
        touchpoint: tp,
        credit: i === touchpoints.length - 1 ? 1.0 : 0
      }))
    
    case 'linear':
      // Equal credit to all touchpoints
      const equalCredit = 1.0 / touchpoints.length
      return touchpoints.map(tp => ({
        touchpoint: tp,
        credit: equalCredit
      }))
    
    case 'u-shaped':
      // 40% first, 40% last, 20% divided among middle
      if (touchpoints.length === 2) {
        return touchpoints.map(tp => ({
          touchpoint: tp,
          credit: 0.5
        }))
      }
      
      const middleCredit = 0.2 / (touchpoints.length - 2)
      return touchpoints.map((tp, i) => ({
        touchpoint: tp,
        credit: i === 0 ? 0.4 :
                i === touchpoints.length - 1 ? 0.4 :
                middleCredit
      }))
    
    case 'time-decay':
      // More recent touchpoints get more credit
      // Half-life of 7 days
      const halfLifeDays = 7
      const lastTimestamp = touchpoints[touchpoints.length - 1].timestamp.getTime()
      
      const weights = touchpoints.map(tp => {
        const daysAgo = (lastTimestamp - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24)
        return Math.pow(2, -daysAgo / halfLifeDays)
      })
      
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      
      return touchpoints.map((tp, i) => ({
        touchpoint: tp,
        credit: weights[i] / totalWeight
      }))
  }
}
```

---

## 🇧🇷 Section 4: Portuguese Metrics & Localization

### Research Sources
- **RD Station**: Leading Brazilian Marketing Automation platform
- **Rock Content**: Brazilian content marketing giant
- **Resultados Digitais**: B2B SaaS terminology leader
- **Conta Azul**: Brazilian accounting SaaS (B2B audience)

---

### Core Principles

1. **Use Natural Terminology** (not literal translations)
   - ✅ "Taxa de Conversão" (natural)
   - ❌ "Índice de Conversão" (too formal/technical)

2. **Keep Familiar Acronyms in English**
   - ✅ ROI, MRR, CAC, LTV, NPS, CSAT, CTR
   - ❌ RDI (Retorno do Investimento), TAC (Taxa de Aquisição de Cliente)
   - **Why**: These are universally recognized in Brazilian B2B, translating causes confusion

3. **Brazilian Number Formatting**
   - Currency: R$ 5.420,50 (dot for thousands, comma for decimal)
   - Percentage: 3,8% (comma decimal)
   - Large numbers: 1.234.567 (dots for thousands)
   - Dates: DD/MM/YYYY (26/02/2026)
   - Time: HH:mm (14:30)

4. **Context-Appropriate Terms**
   - "Funil de Vendas" for stages (Visitante → Lead → Cliente)
   - "Pipeline" for active deals (keep English, widely used)
   - "Ticket Médio" for average deal size (NOT "Valor Médio")

---

### KPI Translations

| Metric | ❌ Avoid | ✅ Use | Context |
|--------|----------|--------|---------|
| Conversion Rate | Índice de Conversão, Percentual de Conversão | Taxa de Conversão | Standard in RD Station |
| Average Deal Size | Valor Médio do Negócio, Preço Médio | Ticket Médio | E-commerce term adopted by B2B |
| Won Deals | Deals Ganhos, Negócios Ganhos | Negócios Fechados | "Fechados" is more natural |
| Lead Generation | Geração de Lead (singular) | Geração de Leads | Always plural in Portuguese B2B |
| Sales Cycle | Ciclo de Venda, Tempo de Venda | Ciclo de Vendas | Standard term |
| Average Response Time | Tempo de Resposta Médio | Tempo Médio de Resposta | Adjective comes first |
| Retention Rate | Taxa de Retenção de Clientes | Taxa de Retenção | "de Clientes" implied |
| Churn Rate | Taxa de Rotatividade | Taxa de Churn | "Churn" kept in English (standard) |
| Qualified Leads | Leads Qualificadas | Leads Qualificados | "Lead" is masculine in PT-BR |
| Pipeline Value | Valor do Pipeline | Pipeline | Pipeline alone is common |

---

### Dashboard KPI Examples

**Basic KPIs** (components/kpi-cards.tsx):
```typescript
const kpis = [
  {
    label: "Total de Leads",      // NOT "Novos Leads" (confusing)
    value: "1,284",
    change: "+12,5%",
    trend: "up"
  },
  {
    label: "Contatos Ativos",      // Keep as is ✅
    value: "892",
    change: "+8,3%",
    trend: "up"
  },
  {
    label: "Taxa de Conversão",    // Add ã accent
    value: "3,8%",                  // Comma decimal
    change: "+2,1%",
    trend: "up"
  },
  {
    label: "Negócios Fechados",    // NOT "Deals Ganhos"
    value: "34",
    change: "+6",
    trend: "up"
  }
]
```

**Advanced KPIs**:
```typescript
const advancedKpis = [
  {
    label: "Pipeline",              // Keep English (standard)
    value: "R$ 245.600",            // BR currency format
    change: "+R$ 32.100"
  },
  {
    label: "Ticket Médio",          // NOT "Valor Médio"
    value: "R$ 5.420",
    change: "+R$ 340"
  },
  {
    label: "Tempo de Conversão",    // NOT "Tempo Médio de Conversão"
    value: "18 dias",
    change: "-2 dias",
    trend: "up" // Decreasing time is good
  },
  {
    label: "Lead Score Médio",      // Keep "Score" in English
    value: "68",
    change: "+4"
  }
]
```

---

### Chart Labels

**Lead Trends Chart**:
```typescript
{
  title: "Tendência de Geração de Leads",  // NOT "Tendências" (singular)
  legends: [
    "Total de Leads",   // NOT "Total Leads"
    "Verificados",      // NOT "Verified"
    "Novos"             // NOT "Upcoming" (use "Novos" or "Recentes")
  ]
}
```

**Conversion Funnel**:
```typescript
{
  title: "Funil de Conversão",
  stages: [
    { name: "Visitante", count: 5420 },
    { name: "Lead", count: 1284 },
    { name: "Qualificado", count: 542 },     // NOT "Lead Qualificado"
    { name: "Oportunidade", count: 234 },    // NOT "Opport unidade de Venda"
    { name: "Proposta", count: 89 },
    { name: "Cliente", count: 34 }           // Final stage
  ]
}
```

**Tag Performance**:
```typescript
{
  title: "Performance por Tag",              // NOT "Desempenho"
  metrics: {
    conversionRate: "Taxa de Conversão",
    dealValue: "Ticket Médio",
    roi: "ROI",                              // Keep English
    count: "Número de Leads"
  }
}
```

---

### Navigation & UI Labels

**Sidebar Navigation**:
```
Dashboard      → Dashboard (keep English, universally recognized)
Contacts       → Contatos
Conversations  → Conversas
Calendar       → Agendamentos (NOT "Calendário" - too generic)
Pipeline       → Pipeline (keep English)
Reports        → Relatórios
Settings       → Configurações
```

**Top Bar Actions**:
```
Search              → Buscar (NOT "Pesquisar" - too formal)
Notifications       → Notificações
New Lead            → Novo Lead
Add Contact         → Adicionar Contato
Send Message        → Enviar Mensagem
Schedule Task       → Agendar Tarefa (NOT "Criar Tarefa")
Export              → Exportar
Filter              → Filtrar
Sort by             → Ordenar por (NOT "Classificar por")
```

**Common Buttons**:
```
Save                → Salvar
Cancel              → Cancelar
Apply               → Aplicar
Reset               → Limpar (NOT "Resetar")
Clear Filters       → Limpar Filtros
View All            → Ver Todos
Load More           → Carregar Mais
Try Again           → Tentar Novamente
```

**Status Labels**:
```
New                 → Novo
In Progress         → Em andamento (NOT "Em progresso")
Pending             → Aguardando (NOT "Pendente" - implies problem)
Completed           → Concluído (NOT "Completo")
Cancelled           → Cancelado
Open                → Aberto
Closed              → Fechado
Active              → Ativo
Inactive            → Inativo
```

**Time Labels**:
```
Today               → Hoje
Yesterday           → Ontem
This week           → Esta semana (NOT "Essa semana")
Last week           → Semana passada OR Última semana
This month          → Este mês
Last month          → Mês passado OR Último mês
Last 7 days         → Últimos 7 dias
Last 30 days        → Últimos 30 dias
Last 90 days        → Últimos 90 dias
Custom              → Personalizado (NOT "Customizado")
```

---

### Number Formatting Functions

```typescript
// lib/formatters.ts

export const formatters = {
  // Currency: R$ 5.420,50
  currency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  },

  // Percentage: 3,8% or 86,5%
  percentage: (value: number, decimals: number = 1): string => {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}%`
  },

  // Number: 1.234 or 1.234,56
  number: (value: number, decimals: number = 0): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },

  // Duration: "18 dias", "2h 30min", "45 min"
  duration: (value: number, unit: 'days' | 'hours' | 'minutes'): string => {
    if (unit === 'days') {
      return `${value} ${value === 1 ? 'dia' : 'dias'}`
    }
    if (unit === 'hours') {
      const hours = Math.floor(value)
      const minutes = Math.round((value - hours) * 60)
      if (minutes === 0) return `${hours}h`
      return `${hours}h ${minutes}min`
    }
    return `${Math.round(value)} min`
  },

  // Date: DD/MM/YYYY
  date: (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(date)
  },

  // Time: HH:mm (14:30)
  time: (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // Relative Date: "Hoje", "Ontem", "Há 3 dias", "26/02/2026"
  relativeDate: (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays <= 7) return `Há ${diffDays} dias`
    if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7)
      return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
    }
    return formatters.date(date)
  },

  // Abbreviated number: 1,2K, 340K, 1,2M
  abbreviated: (value: number): string => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })}M`
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })}K`
    }
    return value.toString()
  }
}
```

---

### Avoid These Literal Translations

| ❌ Don't Use | ✅ Use Instead | Why |
|--------------|----------------|-----|
| Índice de Conversão | Taxa de Conversão | "Taxa" is more natural |
| Pontuação de Lead | Lead Scoring (keep English) | "Scoring" is standard term |
| Estágio do Pipeline | Etapa do Funil | "Etapa" + "Funil" (not "Pipeline" for stages) |
| Valor Médio do Negócio | Ticket Médio | "Ticket" is e-commerce term now B2B standard |
| Essa semana | Esta semana | Grammar: "Esta" for time periods |
| Resetar | Limpar | "Resetar" is anglicism, use "Limpar" |
| Customizado | Personalizado | "Customizado" is anglicism |
| Completo | Concluído | "Concluído" for status, not "Completo" |
| Pendente | Aguardando | "Pendente" implies problem or delay |
| Pesquisar | Buscar | "Buscar" for search action, "Pesquisar" for research |

---

## 🎯 Implementation Priority

### Phase 1 - Typography (30min) ⚡
1. Update `app/layout.tsx`: Add weights + display
2. Update `app/globals.css`: Add font-feature-settings

### Phase 2 - Portuguese Translation (1h) ⚡
1. `components/kpi-cards.tsx`: 4 labels + accent + decimal
2. `components/lead-trends-chart.tsx`: 4 labels
3. `components/recent-leads.tsx`: 2 labels

### Phase 3 - Create Formatters (30min) ⚡
1. Create `lib/formatters.ts` with 8 functions
2. Replace all hardcoded number formatting

---

**Total Research**: 35KB, 1146 lines  
**Time Investment**: ~3 hours research  
**Implementation Estimate**: 27-29 hours total  
**MVP Timeline**: 3-4 days focused work  
**Status**: ✅ Research complete, ready to implement

---

*Documento gerado em*: 26/02/2026  
*Versão*: 1.0  
*Próxima etapa*: Início da implementação (Fase 1 - Typography)
