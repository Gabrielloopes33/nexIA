# 🎨 Especificações Técnicas - NexIA Chat Dashboard

**Versão:** 1.0.0  
**Data:** 26 de Fevereiro de 2026  
**Projeto:** Dashboard CRM - NexIA Chat  
**Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4.2

---

## 📋 Índice

1. [Design System](#-design-system)
2. [Sistema de Cores](#-sistema-de-cores)
3. [Tipografia](#-tipografia)
4. [Componentes Base](#-componentes-base)
5. [Layout & Grid System](#-layout--grid-system)
6. [Padrões de Componentes](#-padrões-de-componentes)
7. [Padrões de Código](#-padrões-de-código)
8. [Estrutura de Dados](#-estrutura-de-dados)
9. [Guidelines de Desenvolvimento](#-guidelines-de-desenvolvimento)
10. [Exemplos de Implementação](#-exemplos-de-implementação)

---

## 🎨 Design System

### Princípios de Design

1. **Consistência Visual**: Todos os cards, botões e componentes seguem o mesmo padrão
2. **Hierarquia Clara**: Uso consistente de tamanhos de fonte, pesos e espaçamento
3. **Feedback Visual**: Estados hover, active, disabled claramente definidos
4. **Responsividade**: Mobile-first com breakpoints bem definidos
5. **Acessibilidade**: Contraste adequado e suporte a navegação por teclado

### Composição Visual Padrão

```
┌─────────────────────────────────────────────────────┐
│  LOGO                                               │
│  ┌─────────┐  ┌──────────────────────────────────┐ │
│  │         │  │  Header (título + ações)         │ │
│  │ Sidebar │  │                                  │ │
│  │  (Roxo) │  │  ┌────────────┬───────────────┐ │ │
│  │         │  │  │            │               │ │ │
│  │ Ícones  │  │  │  Main      │  Right Panel  │ │ │
│  │ Nav     │  │  │  Content   │  (Stats/      │ │ │
│  │         │  │  │  (65%)     │   Actions)    │ │ │
│  │         │  │  │            │   (35%)       │ │ │
│  │         │  │  └────────────┴───────────────┘ │ │
│  └─────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Sistema de Cores

### Paleta Principal

#### Core Colors (CSS Variables)

```css
/* globals.css - :root */
--background: #F3F4F6;          /* Fundo da aplicação */
--foreground: #1F2937;          /* Texto principal */
--card: #FFFFFF;                /* Fundo de cards */
--card-foreground: #1F2937;     /* Texto em cards */

--primary: #2563EB;             /* Azul - Ações primárias */
--primary-foreground: #FFFFFF;  /* Texto em primary */

--sidebar-bg: #7C3AED;          /* Roxo - Sidebar */
--sidebar-foreground: #FFFFFF;  /* Texto na sidebar */

--muted: #F3F4F6;               /* Fundos secundários */
--muted-foreground: #6B7280;    /* Texto secundário/descritivo */

--border: #E5E7EB;              /* Bordas padrão */
--ring: #2563EB;                /* Focus ring */
```

#### Semantic Colors

```css
/* Success */
--success: #16A34A;             /* Verde - Status positivo */
--success-bg: #DCFCE7;          /* Fundo verde claro */

/* Warning */
--warning: #D97706;             /* Laranja - Avisos */
--warning-bg: #FEF3C7;          /* Fundo laranja claro */

/* Destructive/Error */
--destructive: #DC2626;         /* Vermelho - Erros/Ações destrutivas */
--destructive-foreground: #FFFFFF;
```

#### Chart Colors (Data Viz)

```css
--chart-1: #2563EB;  /* Azul */
--chart-2: #F97316;  /* Laranja */
--chart-3: #D1D5DB;  /* Cinza */
--chart-4: #16A34A;  /* Verde */
--chart-5: #7C3AED;  /* Roxo */
```

### Mapeamento de Cores por Contexto

| Contexto | Cor | Hex | Uso |
|----------|-----|-----|-----|
| **Navegação** | Roxo | `#7C3AED` | Sidebar, item ativo |
| **Ações primárias** | Azul | `#2563EB` | Botões, links, foco |
| **Sucesso/Positivo** | Verde | `#16A34A` | Badges "valid", crescimento |
| **Aviso/Atenção** | Laranja | `#D97706` | Badges "risky", alertas |
| **Erro/Crítico** | Vermelho | `#DC2626` | Erros, ações destrutivas |
| **Neutro/Informação** | Cinza | `#6B7280` | Texto secundário, ícones |

### Padrão de Background de Ícones

Cada cor semântica tem um fundo claro correspondente:

| Icon Color | Background | Uso | Exemplo |
|------------|------------|-----|---------|
| `#2563EB` | `#DBEAFE` | Leads, Contatos | KPI Cards |
| `#16A34A` | `#DCFCE7` | Conversão, Status OK | KPI Cards |
| `#7C3AED` | `#E9D5FF` | Agendamentos, Premium | KPI Cards |
| `#D97706` | `#FED7AA` | Deals, Avisos | KPI Cards |

**Código padrão:**
```tsx
<div 
  className="flex h-9 w-9 items-center justify-center rounded-lg"
  style={{ backgroundColor: '#DBEAFE' }}
>
  <Icon className="h-4 w-4" style={{ color: '#2563EB' }} />
</div>
```

---

## 📝 Tipografia

### Font Family

```css
--font-sans: 'Inter', 'Inter Fallback', sans-serif;
```

**Importação (layout.tsx):**
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

### Scale & Hierarchy

| Elemento | Size | Weight | Color | Uso |
|----------|------|--------|-------|-----|
| **Page Title** | `32px` | `700` (Bold) | `foreground` | Título principal da página |
| **Section Title** | `16px` | `600` (Semibold) | `foreground` | Títulos de cards/seções |
| **Body Text** | `14px` | `400` (Regular) | `foreground` | Texto regular |
| **Body Semibold** | `14px` | `600` (Semibold) | `foreground` | Nomes, labels importantes |
| **Caption** | `12px` | `400` (Regular) | `muted-foreground` | Descrições, metadados |
| **Label Uppercase** | `12px` | `500` (Medium) | `muted-foreground` | Labels de KPIs (`uppercase`, `tracking-wider`) |
| **Badge** | `11px` | `500` (Medium) | Semântica | Status badges |

### Classes Tailwind Padrão

```tsx
// Page Title
<h1 className="text-[32px] font-bold leading-tight text-foreground">
  Dashboard
</h1>

// Section Title
<h3 className="text-base font-semibold text-foreground">
  Recent Leads
</h3>

// Body Text
<p className="text-sm text-foreground">
  Conteúdo regular
</p>

// Caption/Secondary
<p className="text-xs text-muted-foreground">
  Informação secundária
</p>

// Uppercase Label (KPIs)
<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
  NOVOS LEADS
</span>
```

---

## 🧱 Componentes Base

### Card (Container Padrão)

**Visual:** Fundo branco, borda cinza clara, sombra sutil, cantos arredondados

**Código:**
```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  {/* Conteúdo */}
</div>
```

**Variações:**
- **Padding:** `p-5` (menor) ou `p-6` (padrão)
- **Com hover:** Adicionar `hover:bg-secondary/50` em items de lista

### Button (shadcn/ui)

**Variantes disponíveis:**

```tsx
import { Button } from "@/components/ui/button"

// Default (Primary - Azul)
<Button variant="default">Novo</Button>

// Outline
<Button variant="outline">Cancelar</Button>

// Ghost (Sem background)
<Button variant="ghost">Editar</Button>

// Destructive (Vermelho)
<Button variant="destructive">Deletar</Button>

// Link style
<Button variant="link">Ver mais</Button>
```

**Tamanhos:**
```tsx
<Button size="sm">Pequeno</Button>     // h-8
<Button size="default">Médio</Button>   // h-9
<Button size="lg">Grande</Button>       // h-10
<Button size="icon">Icon</Button>       // size-9 (quadrado)
```

**Padrão com ícone:**
```tsx
<Button className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  <span>Novo</span>
</Button>
```

### Badge (Status Indicators)

**Padrão visual:** Pill shape, cores semânticas

```tsx
// Success (Verde)
<span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
  valid
</span>

// Warning (Laranja)
<span className="rounded-full bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 text-[11px] font-medium">
  risky
</span>

// Com ícone
<span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#16A34A]">
  <TrendingUp className="h-3 w-3" />
  +11.4%
</span>
```

### Avatar (Iniciais)

**Padrão:** Círculo com iniciais, cores variadas

```tsx
const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#2563EB" },
  { bg: "#DCFCE7", text: "#16A34A" },
  { bg: "#E9D5FF", text: "#7C3AED" },
  { bg: "#FED7AA", text: "#D97706" },
]

<div
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
  style={{ backgroundColor: avatarBg, color: avatarColor }}
>
  {initials}
</div>
```

### Input Field

```tsx
<input
  type="text"
  placeholder="Buscar leads..."
  className="h-10 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
/>

// Com ícone
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <input
    type="text"
    placeholder="Buscar..."
    className="h-10 w-[220px] rounded-lg border border-border bg-card pl-10 pr-4 text-sm..."
  />
</div>
```

### Icon Button

```tsx
<button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
  <Bell className="h-[18px] w-[18px]" />
</button>
```

---

## 📐 Layout & Grid System

### Estrutura Geral da Página

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  {/* Sidebar - Fixa */}
  <Sidebar />

  {/* Main Content - Scroll */}
  <main className="flex-1 overflow-y-auto px-8 py-6">
    <DashboardHeader />

    {/* Grid Principal: 65/35% em telas grandes */}
    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      {/* Left Column (Main Content) */}
      <div className="flex flex-col gap-6">
        {/* Componentes empilhados */}
      </div>

      {/* Right Column (Stats/Actions) */}
      <RightPanel />
    </div>
  </main>
</div>
```

### Breakpoints Tailwind

| Breakpoint | Min Width | Uso |
|------------|-----------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno |
| `xl` | 1280px | Desktop (ativa grid 65/35) |
| `2xl` | 1536px | Desktop grande |

### Spacing System

**Gap entre elementos:**
```tsx
gap-1    // 4px  - Elementos muito próximos
gap-1.5  // 6px  - Ícone + texto inline
gap-2    // 8px  - Botões adjacentes
gap-3    // 12px - Elementos de um card
gap-4    // 16px - Seções de um card
gap-5    // 20px - Entre cards pequenos
gap-6    // 24px - Entre cards principais
```

**Padding de Cards:**
```tsx
p-5  // 20px - Cards menores (Right Panel)
p-6  // 24px - Cards padrão (Main Content)
px-6 py-4 // Header de cards com lista
```

---

## 🧩 Padrões de Componentes

### 1. KPI Card (2x2 Grid)

**Estrutura visual:**
```
┌────────────────────────────┐
│ 🔵 LABEL UPPERCASE         │
│                            │
│ 📈 +11.4%                  │
│                            │
│ 2.842 (valor grande)       │
└────────────────────────────┘
```

**Código template:**
```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  <div className="grid grid-cols-2 gap-0">
    {kpis.map((kpi, index) => {
      const isTop = index < 2
      const isLeft = index % 2 === 0
      return (
        <div
          key={kpi.label}
          className={`flex flex-col gap-3 p-5 
            ${isTop ? "" : "border-t border-border"} 
            ${isLeft ? "" : "border-l border-border"}`}
        >
          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: kpi.iconBg }}
            >
              <Icon className="h-5 w-5" style={{ color: kpi.iconColor }} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
          </div>

          {/* Badge de mudança */}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#16A34A]">
            <TrendingUp className="h-3 w-3" />
            {kpi.change}
          </span>

          {/* Valor principal */}
          <span className="text-[28px] font-bold leading-none text-foreground">
            {kpi.value}
          </span>
        </div>
      )
    })}
  </div>
</div>
```

### 2. List Card (com hover)

**Estrutura:**
```
┌──────────────────────────────────────┐
│  Título               [Ver Todos →] │
├──────────────────────────────────────┤
│  🔵 Nome Principal                   │
│     Descrição secundária         ✓  │
├──────────────────────────────────────┤
│  🟢 Nome Principal                   │
│     Descrição secundária         ✓  │
└──────────────────────────────────────┘
```

**Código template:**
```tsx
<div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  {/* Header */}
  <div className="flex items-center justify-between px-6 py-4">
    <h3 className="text-base font-semibold text-foreground">
      Recent Leads
    </h3>
    <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      Ver Todos
      <ExternalLink className="h-3.5 w-3.5" />
    </button>
  </div>

  {/* List Items */}
  <div className="divide-y divide-border">
    {items.map((item) => (
      <div
        key={item.id}
        className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/50"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full..."
          style={{ backgroundColor: item.avatarBg, color: item.avatarColor }}
        >
          {item.initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>

        {/* Badge ou ação */}
        <span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
          {item.status}
        </span>
      </div>
    ))}
  </div>
</div>
```

### 3. Stats Card (Right Panel)

**Estrutura:**
```
┌──────────────────┐
│ 🔵 Label    1,245│
├──────────────────┤
│ 🟢 Label       38│
├──────────────────┤
│ 🟣 Label       12│
└──────────────────┘
```

**Código template:**
```tsx
<div className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  <div className="flex flex-col gap-4">
    {stats.map((stat, index) => (
      <React.Fragment key={stat.label}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DBEAFE]">
              <Icon className="h-4 w-4 text-[#2563EB]" strokeWidth={1.8} />
            </div>
            <span className="text-sm text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <span className="text-base font-bold text-foreground">
            {stat.value}
          </span>
        </div>
        {index < stats.length - 1 && <div className="h-px bg-border" />}
      </React.Fragment>
    ))}
  </div>
</div>
```

### 4. Progress Bar

```tsx
<div className="flex flex-col gap-1.5">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">LinkedIn</span>
    <span className="text-sm font-semibold text-foreground">645</span>
  </div>
  <div className="h-1.5 w-full rounded-full bg-secondary">
    <div
      className="h-1.5 rounded-full transition-all"
      style={{
        width: '76.6%',
        backgroundColor: '#2563EB',
      }}
    />
  </div>
</div>
```

### 5. Action Button (Outline)

```tsx
<button className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
  <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
  Iniciar LinkedIn Search
</button>
```

---

## 💻 Padrões de Código

### Estrutura de Arquivo de Componente

```tsx
"use client" // Se usa hooks ou eventos

import { Icon1, Icon2 } from "lucide-react"
import { ComponenteDependencia } from "@/components/outro"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "valid" | "risky" | "invalid"

interface Lead {
  id: number
  name: string
  status: Status
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  valid: { label: "Válido", bg: "#DCFCE7", text: "#16A34A" },
  risky: { label: "Risco", bg: "#FEF3C7", text: "#D97706" },
  invalid: { label: "Inválido", bg: "#FEE2E2", text: "#DC2626" },
}

// ─── Mock Data (Temporário) ───────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  { id: 1, name: "Maria Silva", status: "valid" },
  // ...
]

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadsView() {
  // Estado
  const [filter, setFilter] = useState<Status | "all">("all")
  
  // Lógica de filtro
  const filteredLeads = MOCK_LEADS.filter(
    lead => filter === "all" || lead.status === filter
  )

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Conteúdo */}
    </div>
  )
}
```

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Componentes** | PascalCase | `LeadTrendsChart` |
| **Arquivos** | kebab-case | `lead-trends-chart.tsx` |
| **Funções** | camelCase | `handleSubmit`, `fetchLeads` |
| **Constantes** | SCREAMING_SNAKE_CASE | `AVATAR_COLORS`, `STATUS_CONFIG` |
| **Tipos/Interfaces** | PascalCase | `Lead`, `Appointment`, `Status` |
| **CSS Classes** | Tailwind utilities | `rounded-xl`, `bg-card` |

### Organização de Classes Tailwind

**Ordem recomendada:**
1. Display/Position
2. Size (width/height)
3. Spacing (padding/margin)
4. Typography
5. Colors
6. Border/Shadow
7. Transitions
8. States (hover, focus)

```tsx
// ✅ Bom: Organizado
<div className="flex items-center gap-4 px-6 py-3.5 text-sm font-semibold text-foreground rounded-lg border border-border transition-colors hover:bg-secondary">

// ❌ Ruim: Desorganizado
<div className="hover:bg-secondary text-foreground flex rounded-lg py-3.5 border font-semibold gap-4 items-center px-6 text-sm border-border transition-colors">
```

### Uso do Helper `cn()`

```tsx
import { cn } from "@/lib/utils"

// Combinar classes condicionais
<div className={cn(
  "flex items-center gap-2", // Base
  isActive && "bg-primary text-white", // Condicional
  className // Props externas
)} />

// Com ternário inline
<div className={cn(
  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
  status === "valid" 
    ? "bg-[#DCFCE7] text-[#16A34A]"
    : "bg-[#FEF3C7] text-[#D97706]"
)} />
```

---

## 📊 Estrutura de Dados

### Types Comuns

```typescript
// ─── Status Types ─────────────────────────────────────────────────────────────

type Status = "valid" | "risky" | "invalid"
type AppointmentStatus = "pendente" | "confirmado" | "cancelado" | "concluido"
type Channel = "Iframe" | "WhatsApp" | "Instagram"

// ─── Entity Types ─────────────────────────────────────────────────────────────

interface Lead {
  id: number
  name: string
  role: string
  email: string
  status: Status
  avatar: string          // Iniciais
  avatarBg: string        // Hex color
  avatarColor: string     // Hex color
}

interface Appointment {
  id: number
  nome: string
  contato: string
  data: string            // "2024-03-15"
  horario: string         // "14:00"
  status: AppointmentStatus
  tipo: "ligacao" | "reuniao" | "teste" | "demo"
}

interface Conversation {
  id: number
  name: string
  lastMessage: string
  time: string            // "Há 2 min"
  channel: Channel
  status: "active" | "idle"
  avatarBg: string
  avatarColor: string
}

interface KPI {
  label: string           // UPPERCASE
  value: string           // Ex: "2.842"
  change: string          // Ex: "+11.4%"
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

// ─── Config Types ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string
  bg: string
  text: string
  icon?: React.ElementType
}

interface AvatarColor {
  bg: string
  text: string
}
```

### Padrão de Mock Data

```typescript
// Sempre exportar como const com ALL_CAPS para clareza
export const MOCK_LEADS: Lead[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "VP of Sales at TechCorp Inc.",
    email: "sarah.j@techcorp.com",
    status: "valid",
    avatar: "SJ",
    avatarBg: "#DBEAFE",
    avatarColor: "#2563EB",
  },
  // ...
]

export const AVATAR_COLORS: AvatarColor[] = [
  { bg: "#DBEAFE", text: "#2563EB" },
  { bg: "#DCFCE7", text: "#16A34A" },
  { bg: "#E9D5FF", text: "#7C3AED" },
  { bg: "#FED7AA", text: "#D97706" },
]

// Helper para selecionar cor de avatar
export function getAvatarColor(initials: string): AvatarColor {
  const index = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}
```

---

## 📝 Guidelines de Desenvolvimento

### 1. Criando uma Nova Página/Rota

```bash
# Estrutura
app/
  nova-rota/
    page.tsx        # Export default da página
    loading.tsx     # (Opcional) Skeleton de loading
    error.tsx       # (Opcional) Error boundary
```

**Template page.tsx:**
```tsx
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function NovaRotaPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <DashboardHeader />
        
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* Seus componentes principais */}
          </div>

          {/* Right Column (Opcional) */}
          <div className="flex flex-col gap-5">
            {/* Stats, actions, etc */}
          </div>
        </div>
      </main>
    </div>
  )
}
```

### 2. Criando Novo Componente

**Checklist:**
- [ ] Arquivo em `components/` com nome kebab-case
- [ ] Export nomeado ou default (preferir nomeado)
- [ ] Props tipadas com TypeScript
- [ ] Seguir estrutura: Types → Constants → Helpers → Main Component
- [ ] Usar classes Tailwind padrão do design system
- [ ] Adicionar comentários de seção com `// ───`

### 3. Adicionando KPI/Métrica

```tsx
const newKPI = {
  label: "NOVOS DEALS",
  value: "42",
  change: "+18.2%",
  icon: TrendingUp,
  iconBg: "#DCFCE7",
  iconColor: "#16A34A",
}
```

### 4. Adicionando Item de Navegação

```tsx
// components/sidebar.tsx
const topNavItems = [
  // ... existentes
  { 
    label: "Nova Seção", 
    icon: Icon, 
    href: "/nova-secao" 
  },
]
```

### 5. Cores Customizadas

**Quando usar cores inline vs Tailwind:**

```tsx
// ✅ Use inline para cores semânticas/dinâmicas
<div style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}>

// ✅ Use Tailwind para cores fixas do design system
<div className="bg-[#7C3AED] text-white">

// ✅ Use variáveis CSS para temas
<div className="bg-primary text-primary-foreground">
```

### 6. Responsividade

**Padrão mobile-first:**
```tsx
// Base (mobile)        | md (tablet)         | xl (desktop)
<div className="
  flex-col             md:flex-row          xl:grid-cols-[1fr_340px]
  gap-4                md:gap-5              xl:gap-6
  p-4                  md:p-5                xl:p-6
">
```

### 7. Estados Interativos

```tsx
// Hover
className="hover:bg-secondary hover:text-foreground"

// Focus (inputs, buttons)
className="focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

// Active
className="active:scale-95"

// Disabled
className="disabled:opacity-50 disabled:pointer-events-none"

// Transições suaves
className="transition-colors" // Apenas cores
className="transition-all"    // Tudo (usar com moderação)
```

---

## 🎯 Exemplos de Implementação

### Exemplo 1: Card de Lista Completo

```tsx
"use client"

import { ExternalLink, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: number
  name: string
  role: string
  email: string
  status: "active" | "inactive"
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  { id: 1, name: "Maria Silva", role: "CEO", email: "maria@empresa.com", status: "active" },
  { id: 2, name: "João Santos", role: "CTO", email: "joao@empresa.com", status: "active" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactsList() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">
          Contatos Recentes
        </h3>
        <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Ver Todos
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {CONTACTS.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-secondary/50"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-bold text-[#2563EB]">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {contact.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {contact.role}
              </p>
            </div>

            {/* Email */}
            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground lg:flex">
              <Mail className="h-3.5 w-3.5" />
              <span>{contact.email}</span>
            </div>

            {/* Status */}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                contact.status === "active"
                  ? "bg-[#DCFCE7] text-[#16A34A]"
                  : "bg-[#F3F4F6] text-[#6B7280]"
              )}
            >
              {contact.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Exemplo 2: Form com Validação

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function NewLeadForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrar com API
    console.log("Lead criado:", formData)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 text-base font-semibold text-foreground">
        Novo Lead
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Nome Completo
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Maria Silva"
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="maria@empresa.com"
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Empresa */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Empresa
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="TechCorp Inc."
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            <Plus className="h-4 w-4" />
            Criar Lead
          </Button>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
```

### Exemplo 3: Mini Calendario (Agendamentos)

```tsx
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

interface MiniCalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  highlightedDates?: string[] // ["2024-03-15", "2024-03-20"]
}

export function MiniCalendar({ 
  selectedDate, 
  onSelectDate,
  highlightedDates = [] 
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    )
  }

  const isHighlighted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return highlightedDates.includes(dateStr)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-semibold text-foreground">
          {MESES[month]} {year}
        </span>

        <button
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of Week */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="flex h-7 items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const selected = isSelected(day)
          const today = isToday(day)
          const highlighted = isHighlighted(day)

          return (
            <button
              key={day}
              onClick={() => onSelectDate(new Date(year, month, day))}
              className={`
                flex h-7 items-center justify-center rounded-md text-xs font-medium transition-colors
                ${selected 
                  ? "bg-primary text-white" 
                  : today
                  ? "border border-primary text-primary"
                  : "text-foreground hover:bg-secondary"
                }
                ${highlighted && !selected ? "font-bold" : ""}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

---

## ✅ Checklist de Consistência Visual

Use este checklist ao criar novos componentes ou páginas:

### Layout & Estrutura
- [ ] Página usa estrutura `Sidebar` + `Main` + `Right Panel` (se aplicável)
- [ ] Main content tem padding `px-8 py-6`
- [ ] Grid principal usa `xl:grid-cols-[1fr_340px]` para 65/35%
- [ ] Cards empilhados com `gap-6` no main, `gap-5` no right panel

### Cards & Containers
- [ ] Cards usam `rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
- [ ] Padding de cards é `p-6` (main) ou `p-5` (right panel)
- [ ] Headers de lista usam `px-6 py-4`
- [ ] Items de lista usam `px-6 py-3.5` com `hover:bg-secondary/50`

### Tipografia
- [ ] Page title: `text-[32px] font-bold text-foreground`
- [ ] Section title: `text-base font-semibold text-foreground`
- [ ] Body text: `text-sm text-foreground`
- [ ] Secondary text: `text-xs text-muted-foreground`
- [ ] KPI labels: `text-xs font-medium uppercase tracking-wider text-muted-foreground`

### Cores & Ícones
- [ ] Usa variáveis CSS (`bg-primary`, `text-muted-foreground`)
- [ ] Ícones têm tamanho consistente: `h-4 w-4` ou `h-5 w-5`
- [ ] Icon containers: `h-9 w-9` ou `h-10 w-10` com `rounded-lg`
- [ ] Background de ícones usa pares de cores semânticas (ex: `#DBEAFE` + `#2563EB`)

### Estados & Interações
- [ ] Hover states definidos (`hover:bg-secondary`, `hover:text-foreground`)
- [ ] Focus states para inputs (`focus:border-primary focus:ring-1 focus:ring-primary`)
- [ ] Transições suaves (`transition-colors` ou `transition-all`)
- [ ] Estados desabilitados tratados (`disabled:opacity-50`)

### Componentes Específicos
- [ ] Avatares: `h-9 w-9 rounded-full` com cores do AVATAR_COLORS
- [ ] Badges: `rounded-full px-2.5 py-0.5 text-[11px] font-medium`
- [ ] Botões usam componente `<Button>` do shadcn/ui
- [ ] Ícones de `lucide-react` com `strokeWidth={1.8}` ou `strokeWidth={1.6}`

### Código & Organização
- [ ] Arquivo em kebab-case (`my-component.tsx`)
- [ ] Seções organizadas com comentários `// ─── Section ───`
- [ ] Types/interfaces definidos no topo
- [ ] Mock data com ALL_CAPS (`MOCK_LEADS`)
- [ ] Props tipadas com TypeScript

---

## 🚀 Próximos Passos & Evolução

### Fase 1: Backend Integration (em desenvolvimento)
- Substituir mock data por API calls
- Implementar React Query para cache
- Adicionar loading states e skeletons
- Error handling global

### Fase 2: Autenticação
- NextAuth.js para login
- Proteção de rotas
- Perfil de usuário no header

### Fase 3: Real-time Features
- WebSockets para notificações
- Chat em tempo real
- Updates automáticos de dashboard

### Fase 4: Performance
- Lazy loading de componentes pesados
- Otimização de imagens
- Code splitting por rota
- Service Worker para cache

---

## 📚 Recursos & Referências

### Documentação
- **Next.js 16:** https://nextjs.org/docs
- **React 19:** https://react.dev/
- **Tailwind CSS 4:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **Lucide Icons:** https://lucide.dev/

### Design Tools
- **Figma (futuro):** Criar designs system no Figma
- **Storybook (futuro):** Documentação visual de componentes

### Testing (futuro)
- **Vitest:** Framework de testes
- **Testing Library:** Testes de componentes
- **Playwright:** E2E testing

---

## 📞 Contato & Suporte

**Mantenedores:**
- Time de Desenvolvimento NexIA Chat

**Documentos Relacionados:**
- [ANALISE-PROJETO.md](.claude/ANALISE-PROJETO.md) - Análise completa do projeto
- [CLAUDE.md](.claude/CLAUDE.md) - Regras para Claude Code

**Versionamento:**
- v1.0.0 (26/02/2026) - Documento inicial com todos os padrões atuais

---

**🎯 Objetivo Deste Documento:**  
Garantir que todas as novas telas, componentes e features mantenham consistência visual e seguem os mesmos padrões arquiteturais, resultando em uma experiência uniforme para o usuário e código fácil de manter para desenvolvedores.

---

*Documento criado com AIOS Framework - Technical Design Doc Creator Skill*  
*Última atualização: 26 de Fevereiro de 2026*
