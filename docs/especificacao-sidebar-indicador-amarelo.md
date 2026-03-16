# Sidebar com Indicador Amarelo - Implementação Rápida

## Arquivos para Criar

```
components/
├── sidebar.tsx              # Principal
├── sidebar-dropdown-group.tsx
├── sidebar-nav-config.ts
hooks/
├── use-sidebar-dropdowns.ts
lib/
└── utils.ts                 # função cn()
```

## Código (copiar e colar)

### 1. lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. hooks/use-sidebar-dropdowns.ts
```ts
"use client"
import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
const STORAGE_KEY = 'sidebar-open-groups'
export function useSidebarDropdowns(navItems: any[]) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setOpenGroups(new Set(JSON.parse(saved)))
  }, [])
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...openGroups]))
  }, [openGroups])
  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => prev.has(key) ? new Set() : new Set([key]))
  }, [])
  return { openGroups, toggleGroup, isGroupOpen: (k: string) => openGroups.has(k) }
}
```

### 3. components/sidebar-nav-config.ts
```ts
import { LayoutDashboard, MessageSquare, Settings } from "lucide-react"
export const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "conversas", label: "Conversas", icon: MessageSquare, 
    children: [
      { label: "Todas", href: "/conversas" },
      { label: "Menções", href: "/conversas/mentions" }
    ] 
  },
]
```

### 4. components/sidebar-dropdown-group.tsx
```tsx
"use client"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
export function SidebarDropdownGroup({ item, isOpen, onToggle, pathname }: any) {
  const Icon = item.icon
  const hasActiveChild = item.children?.some((c: any) => pathname === c.href)
  return (
    <div className="w-full">
      <button onClick={onToggle} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all", isOpen ? "bg-white/10" : "hover:bg-white/10", hasActiveChild && !isOpen && "bg-white/5")}>
        <Icon className="h-5 w-5 text-white" />
        <span className="text-[14px] font-medium text-white flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-white/70 transition-transform", isOpen && "rotate-180")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="relative ml-[22px] pl-0 mt-1">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-white/15" />
          {item.children?.map((child: any) => {
            const isActive = pathname === child.href
            return (
              <Link key={child.href} href={child.href} className={cn("block py-1.5 text-[13px] relative rounded-md transition-colors", isActive ? "bg-white/20 text-white font-medium pl-5" : "text-white/80 hover:bg-white/10 hover:text-white pl-4")}>
                {isActive && <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full" />}
                <span>{child.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

### 5. components/sidebar.tsx
```tsx
"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebarDropdowns } from "@/hooks/use-sidebar-dropdowns"
import { SidebarDropdownGroup } from "@/components/sidebar-dropdown-group"
import { navItems } from "@/components/sidebar-nav-config"
export function Sidebar() {
  const pathname = usePathname()
  const { toggleGroup, isGroupOpen } = useSidebarDropdowns(navItems)
  return (
    <div className="flex h-screen flex-col py-4 pl-3 w-[220px] bg-[#46347F]">
      <div className="mb-3 px-1"><Image src="/logo.png" alt="Logo" width={180} height={50} /></div>
      <div className="flex flex-1 flex-col rounded-lg py-4 px-2 shadow-[4px_0_24px_rgba(0,0,0,0.18)]">
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href && pathname.startsWith(item.href + "/"))
            const Icon = item.icon
            if (item.children) return <SidebarDropdownGroup key={item.key} item={item} isOpen={isGroupOpen(item.key)} onToggle={() => toggleGroup(item.key)} pathname={pathname} />
            return (
              <Link key={item.key} href={item.href || "#"} className={cn("flex items-center rounded-sm h-9 gap-3 transition-all relative", isActive ? "bg-white/30 text-white pl-4 pr-3" : "text-white hover:bg-white/15 px-3")}>
                {isActive && <span className="absolute -left-2 top-0 bottom-0 w-1 bg-[#f3c845] rounded-full" />}
                <Icon className="h-4 w-4 text-white" />
                <span className="text-[13px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
```

## Checklist

- [ ] Instalar dependências: `npm install clsx tailwind-merge lucide-react`
- [ ] Criar `lib/utils.ts`
- [ ] Criar `hooks/use-sidebar-dropdowns.ts`
- [ ] Criar `components/sidebar-nav-config.ts`
- [ ] Criar `components/sidebar-dropdown-group.tsx`
- [ ] Criar `components/sidebar.tsx`
- [ ] Adicionar logo em `public/logo.png`
- [ ] Verificar indicador amarelo `#f3c845` nos itens ativos
