# 🚀 Quick Reference Guide - NexIA Chat Dashboard

**Guia rápido para desenvolvimento com consistência visual**

---

## 🎨 Cores Quick Ref

```tsx
// Primary Actions
bg-primary text-primary-foreground  // #2563EB (Azul)

// Sidebar
bg-[#7C3AED] text-white             // Roxo

// Status Colors
bg-[#DCFCE7] text-[#16A34A]         // Success/Valid (Verde)
bg-[#FEF3C7] text-[#D97706]         // Warning/Risky (Laranja)
bg-[#FEE2E2] text-[#DC2626]         // Error/Invalid (Vermelho)

// Icon Backgrounds (sempre com par)
bg-[#DBEAFE] + text-[#2563EB]       // Azul
bg-[#DCFCE7] + text-[#16A34A]       // Verde
bg-[#E9D5FF] + text-[#7C3AED]       // Roxo
bg-[#FED7AA] + text-[#D97706]       // Laranja

// Semantic
text-foreground                     // Texto principal
text-muted-foreground               // Texto secundário
bg-background                       // Fundo app
bg-card                             // Fundo cards
border-border                       // Bordas
```

---

## 📦 Card Padrão

```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  {/* Content */}
</div>
```

---

## 📋 List Card Template

```tsx
<div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  {/* Header */}
  <div className="flex items-center justify-between px-6 py-4">
    <h3 className="text-base font-semibold text-foreground">Título</h3>
    <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      Ver Todos <ExternalLink className="h-3.5 w-3.5" />
    </button>
  </div>

  {/* List */}
  <div className="divide-y divide-border">
    {items.map(item => (
      <div key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/50">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-bold text-[#2563EB]">
          AB
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
        </div>

        {/* Badge */}
        <span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
          valid
        </span>
      </div>
    ))}
  </div>
</div>
```

---

## 🔘 Botões

```tsx
import { Button } from "@/components/ui/button"

<Button>Primário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Deletar</Button>

<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>

// Com ícone
<Button className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  Novo
</Button>
```

---

## 🏷️ Badge

```tsx
// Success
<span className="rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-[11px] font-medium">
  valid
</span>

// Warning
<span className="rounded-full bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 text-[11px] font-medium">
  risky
</span>

// Com ícone
<span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#16A34A]">
  <TrendingUp className="h-3 w-3" />
  +11.4%
</span>
```

---

## 👤 Avatar

```tsx
<div 
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
  style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}
>
  AB
</div>
```

---

## 🔍 Input com Ícone

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <input
    type="text"
    placeholder="Buscar..."
    className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  />
</div>
```

---

## 🎯 Icon Container

```tsx
<div 
  className="flex h-9 w-9 items-center justify-center rounded-lg"
  style={{ backgroundColor: '#DBEAFE' }}
>
  <Users className="h-4 w-4" style={{ color: '#2563EB' }} strokeWidth={1.8} />
</div>

// Ou 10x10 para KPIs
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE]">
  <Users className="h-5 w-5 text-[#2563EB]" strokeWidth={1.8} />
</div>
```

---

## 📊 Progress Bar

```tsx
<div className="flex flex-col gap-1.5">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Label</span>
    <span className="text-sm font-semibold text-foreground">645</span>
  </div>
  <div className="h-1.5 w-full rounded-full bg-secondary">
    <div 
      className="h-1.5 rounded-full" 
      style={{ width: '76%', backgroundColor: '#2563EB' }}
    />
  </div>
</div>
```

---

## 📐 Layout Padrão

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  
  <main className="flex-1 overflow-y-auto px-8 py-6">
    <DashboardHeader />
    
    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
      {/* Left: Main Content */}
      <div className="flex flex-col gap-6">
        {/* Cards aqui */}
      </div>

      {/* Right: Stats/Actions */}
      <div className="flex flex-col gap-5">
        {/* Cards menores aqui */}
      </div>
    </div>
  </main>
</div>
```

---

## 📝 Tipografia

```tsx
// Page Title
<h1 className="text-[32px] font-bold leading-tight text-foreground">
  Dashboard
</h1>

// Section Title
<h3 className="text-base font-semibold text-foreground">
  Recent Leads
</h3>

// Body
<p className="text-sm text-foreground">Normal text</p>
<p className="text-sm font-semibold text-foreground">Bold text</p>

// Secondary/Caption
<p className="text-xs text-muted-foreground">Secondary info</p>

// KPI Label
<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
  NOVOS LEADS
</span>
```

---

## 🎨 Spacing Quick Ref

```tsx
// Gap (entre elementos)
gap-1    // 4px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
gap-5    // 20px
gap-6    // 24px

// Padding de Cards
p-5      // 20px (right panel)
p-6      // 24px (main cards)
px-6 py-4 // Headers de lista
px-6 py-3.5 // Items de lista
```

---

## 🔄 Estados & Transições

```tsx
// Hover
hover:bg-secondary
hover:bg-secondary/50
hover:text-foreground

// Focus (inputs)
focus:border-primary 
focus:outline-none 
focus:ring-1 
focus:ring-primary

// Transition
transition-colors
transition-all

// Disabled
disabled:opacity-50 
disabled:pointer-events-none
```

---

## 📱 Responsividade

```tsx
// Mobile first
className="
  flex-col          // mobile
  md:flex-row       // tablet (768px+)
  xl:grid-cols-2    // desktop (1280px+)
"

// Hide/Show
className="
  hidden            // oculto no mobile
  md:flex           // visível no tablet+
  lg:block          // visível no desktop+
"
```

---

## 🎯 Action Button (Outline)

```tsx
<button className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
  <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
  Iniciar LinkedIn Search
</button>
```

---

## 📊 KPI Card Grid (2x2)

```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
  <div className="grid grid-cols-2 gap-0">
    {kpis.map((kpi, i) => (
      <div
        key={kpi.label}
        className={`flex flex-col gap-3 p-5 
          ${i < 2 ? "" : "border-t border-border"} 
          ${i % 2 === 0 ? "" : "border-l border-border"}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: kpi.iconBg }}>
            <Icon className="h-5 w-5" style={{ color: kpi.iconColor }} />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#16A34A]">
          <TrendingUp className="h-3 w-3" />
          {kpi.change}
        </span>
        <span className="text-[28px] font-bold leading-none text-foreground">
          {kpi.value}
        </span>
      </div>
    ))}
  </div>
</div>
```

---

## 🧩 Utils

```tsx
import { cn } from "@/lib/utils"

// Combinar classes condicionais
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Props
)} />
```

---

## 📦 Imports Comuns

```tsx
"use client"

import { useState } from "react"
import { Icon1, Icon2, Icon3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

---

## 🎨 Paleta de Cores dos Ícones

| Uso | Background | Foreground |
|-----|------------|------------|
| **Leads/Primary** | `#DBEAFE` | `#2563EB` |
| **Success/Valid** | `#DCFCE7` | `#16A34A` |
| **Premium/Agendamentos** | `#E9D5FF` | `#7C3AED` |
| **Warning/Deals** | `#FED7AA` | `#D97706` |

---

## ✅ Checklist Rápido

Ao criar novo componente:

- [ ] Usa `rounded-xl border border-border bg-card`
- [ ] Shadow: `shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
- [ ] Padding: `p-6` (main) ou `p-5` (right panel)
- [ ] Títulos: `text-base font-semibold text-foreground`
- [ ] Ícones: `h-4 w-4` ou `h-5 w-5`
- [ ] Hover states definidos
- [ ] Transitions suaves
- [ ] Typesafe com TypeScript
- [ ] Mobile responsive

---

## 🔗 Links Úteis

- **Documentação completa:** [ESPECIFICACOES-TECNICAS.md](.claude/ESPECIFICACOES-TECNICAS.md)
- **Análise do projeto:** [ANALISE-PROJETO.md](.claude/ANALISE-PROJETO.md)
- **Lucide Icons:** https://lucide.dev/
- **Tailwind Docs:** https://tailwindcss.com/docs

---

*Quick Reference v1.0 - NexIA Chat Dashboard*
