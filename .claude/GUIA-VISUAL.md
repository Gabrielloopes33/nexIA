# 🎨 Guia Visual de Componentes - NexIA Chat Dashboard

**Exemplos visuais lado a lado para garantir consistência**

---

## 🎯 Objetivo

Este guia mostra visualmente como os componentes devem ser construídos, com comparações de ✅ Correto vs ❌ Incorreto.

---

## 📦 CARDS

### ✅ CORRETO - Card Padrão

```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  <h3 className="mb-4 text-base font-semibold text-foreground">
    Título da Seção
  </h3>
  <p className="text-sm text-foreground">
    Conteúdo do card com espaçamento adequado.
  </p>
</div>
```

**Visual:**
```
┌─────────────────────────────────────┐
│  Título da Seção                    │ ← h3, 16px, Semibold
│                                     │
│  Conteúdo do card com espaçamento  │ ← p, 14px, Regular
│  adequado.                          │
│                                     │
└─────────────────────────────────────┘
   ↑ rounded-xl, border, padding 24px
```

### ❌ INCORRETO

```tsx
// ❌ Falta shadow
<div className="rounded-lg border bg-white p-4">

// ❌ Border radius errado (lg vs xl)
<div className="rounded-lg border border-border bg-card p-6">

// ❌ Padding muito pequeno
<div className="rounded-xl border border-border bg-card p-3">

// ❌ Sem variáveis CSS
<div className="rounded-xl border border-gray-200 bg-white p-6">
```

---

## 🏷️ BADGES

### ✅ CORRETO - Status Badges

```tsx
// Success (Verde)
<span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
  válido
</span>

// Warning (Laranja)
<span className="rounded-full bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 text-[11px] font-medium">
  risco
</span>

// Error (Vermelho)
<span className="rounded-full bg-[#FEE2E2] text-[#DC2626] px-2.5 py-0.5 text-[11px] font-medium">
  inválido
</span>
```

**Visual:**
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ válido  │  │  risco  │  │inválido │
└─────────┘  └─────────┘  └─────────┘
   Verde        Laranja      Vermelho
```

### ❌ INCORRETO

```tsx
// ❌ Cores erradas
<span className="bg-green-100 text-green-600">válido</span>

// ❌ Tamanho de texto errado
<span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-xs">

// ❌ Border radius errado
<span className="rounded-md bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5">

// ❌ Padding errado
<span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-3 py-1">
```

---

## 👤 AVATARES

### ✅ CORRETO - Avatar com Iniciais

```tsx
<div 
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
  style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}
>
  MS
</div>
```

**Pares de cores corretos:**
```
Azul:    bg: #DBEAFE  text: #2563EB
Verde:   bg: #DCFCE7  text: #16A34A
Roxo:    bg: #E9D5FF  text: #7C3AED
Laranja: bg: #FED7AA  text: #D97706
```

**Visual:**
```
  ┌───┐  ┌───┐  ┌───┐  ┌───┐
  │ MS│  │ JD│  │ AB│  │ XY│
  └───┘  └───┘  └───┘  └───┘
  Azul  Verde  Roxo  Laranja
```

### ❌ INCORRETO

```tsx
// ❌ Tamanho errado
<div className="flex h-10 w-10 rounded-full">

// ❌ Border radius errado
<div className="flex h-9 w-9 rounded-lg">

// ❌ Cores não são pares semânticos
<div style={{ backgroundColor: '#blue', color: 'white' }}>

// ❌ Sem shrink-0 (pode comprimir)
<div className="flex h-9 w-9 rounded-full">
```

---

## 🔘 BOTÕES

### ✅ CORRETO - Usando Button Component

```tsx
import { Button } from "@/components/ui/button"

// Primary
<Button>Salvar</Button>

// Outline
<Button variant="outline">Cancelar</Button>

// Com ícone
<Button className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  Novo Item
</Button>
```

**Visual:**
```
┌─────────┐  ┌─────────┐  ┌───┬─────────┐
│ Salvar  │  │Cancelar │  │ + │ Novo    │
└─────────┘  └─────────┘  └───┴─────────┘
  Primary      Outline      Com Ícone
```

### ❌ INCORRETO

```tsx
// ❌ Não usar button HTML direto (sem estilização consistente)
<button className="bg-blue-500 text-white px-4 py-2">
  Salvar
</button>

// ❌ Classes Tailwind custom sem usar o componente
<button className="rounded-lg bg-primary px-4 py-2">
  Salvar
</button>

// ❌ Ícone com tamanho errado
<Button>
  <Plus className="h-6 w-6" /> Muito Grande
</Button>
```

---

## 📋 LIST ITEMS

### ✅ CORRETO - Item de Lista com Hover

```tsx
<div className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-secondary/50">
  {/* Avatar */}
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-bold text-[#2563EB]">
    MS
  </div>
  
  {/* Content */}
  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-semibold text-foreground">
      Maria Silva
    </p>
    <p className="truncate text-xs text-muted-foreground">
      CEO at TechCorp Inc.
    </p>
  </div>

  {/* Badge */}
  <span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
    valid
  </span>
</div>
```

**Visual:**
```
┌──────────────────────────────────────────┐
│  ┌──┐  Maria Silva              valid   │
│  │MS│  CEO at TechCorp Inc.      ○      │
│  └──┘                                    │
└──────────────────────────────────────────┘
   ↑ hover:bg-secondary/50
```

### ❌ INCORRETO

```tsx
// ❌ Sem hover state
<div className="flex items-center gap-4 px-6 py-3.5">

// ❌ Sem truncate (texto pode quebrar layout)
<div className="flex-1">
  <p className="text-sm font-semibold">Maria Silva</p>
</div>

// ❌ Sem min-w-0 (flex pode não truncar)
<div className="flex-1">
  <p className="truncate text-sm">...</p>
</div>

// ❌ Padding errado
<div className="flex items-center gap-4 p-4">
```

---

## 🎨 ICON CONTAINERS

### ✅ CORRETO - Container de Ícone com fundo colorido

```tsx
// Tamanho 9x9 (padrão)
<div 
  className="flex h-9 w-9 items-center justify-center rounded-lg"
  style={{ backgroundColor: '#DBEAFE' }}
>
  <Users className="h-4 w-4" style={{ color: '#2563EB' }} strokeWidth={1.8} />
</div>

// Tamanho 10x10 (KPIs)
<div 
  className="flex h-10 w-10 items-center justify-center rounded-lg"
  style={{ backgroundColor: '#DBEAFE' }}
>
  <Users className="h-5 w-5" style={{ color: '#2563EB' }} strokeWidth={1.8} />
</div>
```

**Visual:**
```
  ┌────┐  ┌─────┐
  │ 👤 │  │ 👤  │
  └────┘  └─────┘
   9x9     10x10
  h-4 w-4  h-5 w-5
```

### ❌ INCORRETO

```tsx
// ❌ Border radius errado
<div className="flex h-9 w-9 items-center justify-center rounded-full">

// ❌ Tamanhos inconsistentes
<div className="flex h-8 w-8 items-center justify-center rounded-lg">
  <Users className="h-6 w-6" />
</div>

// ❌ Sem cores inline (pares semânticos)
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
  <Users className="h-4 w-4 text-blue-600" />
</div>
```

---

## 🔍 INPUTS

### ✅ CORRETO - Input com Ícone

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <input
    type="text"
    placeholder="Buscar leads..."
    className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  />
</div>
```

**Visual:**
```
┌─────────────────────────────────┐
│ 🔍  Buscar leads...             │
└─────────────────────────────────┘
   ↑ left-3, pl-10 no input
```

### ❌ INCORRETO

```tsx
// ❌ Sem estados de focus
<input className="h-10 w-full rounded-lg border border-border bg-card px-4" />

// ❌ Posicionamento do ícone errado
<div className="flex items-center gap-2">
  <Search className="h-4 w-4" />
  <input />
</div>

// ❌ Cores não usam variáveis CSS
<input className="h-10 w-full rounded-lg border border-gray-300 bg-white" />
```

---

## 📊 PROGRESS BARS

### ✅ CORRETO - Barra de Progresso

```tsx
<div className="flex flex-col gap-1.5">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">LinkedIn</span>
    <span className="text-sm font-semibold text-foreground">645</span>
  </div>
  <div className="h-1.5 w-full rounded-full bg-secondary">
    <div 
      className="h-1.5 rounded-full transition-all"
      style={{ width: '76.6%', backgroundColor: '#2563EB' }}
    />
  </div>
</div>
```

**Visual:**
```
LinkedIn                    645
███████████████░░░░░░░░░░░  76.6%
```

### ❌ INCORRETO

```tsx
// ❌ Altura errada (muito grossa)
<div className="h-3 w-full rounded-full bg-secondary">

// ❌ Sem transição
<div className="h-1.5 rounded-full" style={{ width: '76%' }}>

// ❌ Backgrounds errados
<div className="h-1.5 w-full bg-gray-200">
  <div className="h-1.5 bg-blue-500" style={{ width: '76%' }}>
```

---

## 📐 SPACING & LAYOUT

### ✅ CORRETO - Layout de Página

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  {/* Sidebar fixo */}
  <Sidebar />
  
  {/* Main com scroll */}
  <main className="flex-1 overflow-y-auto px-8 py-6">
    <DashboardHeader />
    
    {/* Grid 65/35 no desktop */}
    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      {/* Left */}
      <div className="flex flex-col gap-6">
        {/* Cards principais */}
      </div>

      {/* Right */}
      <div className="flex flex-col gap-5">
        {/* Stats/Actions */}
      </div>
    </div>
  </main>
</div>
```

**Visual Desktop:**
```
┌───┬──────────────────────────────────────┐
│   │  Header                              │
│ S ├──────────────────┬───────────────────┤
│ I │                  │                   │
│ D │  Main Content    │   Right Panel     │
│ E │  (65%)           │   Stats (35%)     │
│ B │  gap-6           │   gap-5           │
│ A │                  │                   │
│ R │                  │                   │
└───┴──────────────────┴───────────────────┘
```

### ❌ INCORRETO

```tsx
// ❌ Padding inconsistente
<main className="flex-1 overflow-y-auto p-5">

// ❌ Grid sem responsividade
<div className="grid grid-cols-[1fr_340px]">

// ❌ Gap inconsistente
<div className="flex flex-col gap-4">

// ❌ Sem overflow control
<main className="flex-1 px-8 py-6">
```

---

## 🎯 TIPOGRAFIA

### ✅ CORRETO - Hierarquia de Texto

```tsx
{/* Page Title */}
<h1 className="text-[32px] font-bold leading-tight text-foreground">
  Dashboard
</h1>

{/* Section Title */}
<h3 className="text-base font-semibold text-foreground">
  Recent Leads
</h3>

{/* Body Regular */}
<p className="text-sm text-foreground">
  Conteúdo regular da página.
</p>

{/* Body Semibold */}
<p className="text-sm font-semibold text-foreground">
  Maria Silva
</p>

{/* Caption/Secondary */}
<p className="text-xs text-muted-foreground">
  VP of Sales at TechCorp Inc.
</p>

{/* KPI Label */}
<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
  NOVOS LEADS
</span>
```

**Visual:**
```
Dashboard                 ← 32px, Bold
Recent Leads              ← 16px, Semibold
Conteúdo regular          ← 14px, Regular
Maria Silva               ← 14px, Semibold
VP of Sales...            ← 12px, Regular, Muted
NOVOS LEADS               ← 12px, Medium, Uppercase
```

### ❌ INCORRETO

```tsx
// ❌ Tamanhos inconsistentes
<h1 className="text-3xl font-bold">Dashboard</h1>
<h3 className="text-lg font-semibold">Recent Leads</h3>

// ❌ Cores hardcoded
<p className="text-sm text-gray-700">Conteúdo</p>
<p className="text-xs text-gray-500">Secundário</p>

// ❌ Labels sem uppercase/tracking
<span className="text-xs font-medium">novos leads</span>
```

---

## ✅ CHECKLIST VISUAL RÁPIDO

Use este checklist ao criar componentes:

### Cards
- [ ] `rounded-xl` (não lg ou md)
- [ ] `border border-border` (não gray-200)
- [ ] `bg-card` (não white)
- [ ] `shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
- [ ] `p-6` main ou `p-5` right panel

### Badges
- [ ] `rounded-full` (não rounded-md)
- [ ] `px-2.5 py-0.5`
- [ ] `text-[11px] font-medium`
- [ ] Cores semânticas (verde, laranja, vermelho)

### Avatares
- [ ] `h-9 w-9` padrão
- [ ] `rounded-full`
- [ ] `text-xs font-bold`
- [ ] `shrink-0`
- [ ] Pares de cores corretos

### Ícones
- [ ] `h-4 w-4` ou `h-5 w-5`
- [ ] `strokeWidth={1.8}` ou `{1.6}`
- [ ] Container 9x9 ou 10x10
- [ ] Background com par semântico

### Inputs
- [ ] `h-10`
- [ ] `rounded-lg`
- [ ] States de focus definidos
- [ ] Placeholder com `placeholder:text-muted-foreground`

### List Items
- [ ] `px-6 py-3.5`
- [ ] `hover:bg-secondary/50`
- [ ] `transition-colors`
- [ ] Content com `min-w-0 flex-1`
- [ ] Texto com `truncate`

---

## 🎨 Paleta de Cores Visual

```
PRIMÁRIAS
━━━━━━━━━━━━━━━━━━
███ #2563EB  Azul (Primary)
███ #7C3AED  Roxo (Sidebar)

SEMÂNTICAS
━━━━━━━━━━━━━━━━━━
███ #16A34A  Verde (Success)
███ #D97706  Laranja (Warning)
███ #DC2626  Vermelho (Error)

BACKGROUNDS DE ÍCONES
━━━━━━━━━━━━━━━━━━
███ #DBEAFE  → Azul claro
███ #DCFCE7  → Verde claro
███ #E9D5FF  → Roxo claro
███ #FED7AA  → Laranja claro

NEUTROS
━━━━━━━━━━━━━━━━━━
███ #1F2937  Text (Foreground)
███ #6B7280  Text Secondary (Muted)
███ #E5E7EB  Borders
███ #F3F4F6  Background
███ #FFFFFF  Cards
```

---

## 📏 Grid de Tamanhos

```
HEIGHTS
━━━━━━━
h-7   →  28px  (Calendar days)
h-8   →  32px  (Button sm)
h-9   →  36px  (Avatar, Button default)
h-10  →  40px  (Input, Button lg, Icon container KPI)

ICON SIZES
━━━━━━━━━━
h-3 w-3   →  Badges internos
h-3.5 w-3.5 → Links "Ver todos"
h-4 w-4   →  Padrão (buttons, icons)
h-5 w-5   →  Sidebar icons, KPI icons

GAPS
━━━━━━
gap-1    →  4px   (muito próximo)
gap-1.5  →  6px   (ícone + texto)
gap-2    →  8px   (elementos relacionados)
gap-3    →  12px  (seções de card)
gap-4    →  16px  (elementos de lista)
gap-5    →  20px  (entre cards right panel)
gap-6    →  24px  (entre cards main)
```

---

**🎯 Dica Final:** Sempre consulte este guia quando em dúvida sobre espaçamento, cores ou tamanhos. Consistência é chave!

---

*Guia Visual v1.0 - NexIA Chat Dashboard*  
*Para mais detalhes: ESPECIFICACOES-TECNICAS.md*
