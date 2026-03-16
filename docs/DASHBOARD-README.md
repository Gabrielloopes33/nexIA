# Dashboard Analytics - Implementação

Este documento contém as instruções para implementar o Dashboard Analytics com renderização instantânea e skeleton loading.

## 📋 Requisitos

- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)

## 📦 Instalação de Dependências

```bash
# React Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# Animações
npm install framer-motion

# Ícones
npm install lucide-react

# Utilitários (se ainda não tiver)
npm install clsx tailwind-merge class-variance-authority
```

## 🚀 Setup Inicial

### 1. Adicione o Provider do React Query

No arquivo `app/layout.tsx`:

```tsx
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

### 2. Adicione os estilos de Skeleton

No arquivo `app/globals.css` ou `app/layout.tsx`:

```tsx
import '@/styles/skeleton.css';
```

### 3. Crie o arquivo de utilitários (se não existir)

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 📁 Estrutura de Arquivos Criada

```
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Layout com Sidebar + KPIs
│   │   └── page.tsx            # Página principal
│   └── api/dashboard/          # API Routes (mock)
│       ├── funnel/route.ts
│       ├── revenue/route.ts
│       └── kpis/route.ts
├── components/
│   ├── dashboard/
│   │   ├── cards/              # Cards do dashboard
│   │   │   ├── FunnelCard.tsx
│   │   │   ├── RecoveryCard.tsx
│   │   │   ├── ChannelsCard.tsx
│   │   │   ├── LossReasonsCard.tsx
│   │   │   ├── RevenueCard.tsx
│   │   │   └── HealthScoreCard.tsx
│   │   ├── skeletons/          # Skeletons reutilizáveis
│   │   │   ├── CardSkeleton.tsx
│   │   │   ├── FunnelSkeleton.tsx
│   │   │   ├── ChartSkeleton.tsx
│   │   │   ├── CircleSkeleton.tsx
│   │   │   └── ListSkeleton.tsx
│   │   └── layout/             # Componentes de layout
│   │       ├── Sidebar.tsx
│   │       ├── KpiColumn.tsx
│   │       └── DashboardGrid.tsx
│   └── providers/
│       └── ReactQueryProvider.tsx
├── hooks/
│   └── dashboard/              # Custom hooks
│       ├── useFunnelData.ts
│       ├── useRevenueData.ts
│       └── ...
├── lib/
│   ├── dashboard/
│   │   ├── queries.ts          # Config React Query
│   │   └── mock-data.ts        # Dados mockados
│   └── utils-format.ts         # Formatters
├── styles/
│   └── skeleton.css            # Animações skeleton
├── types/
│   ├── dashboard.ts            # Interfaces TypeScript
│   └── api.ts                  # Tipos de API
└── docs/
    └── TDD-Dashboard-Analytics.md  # Documento técnico completo
```

## 🎯 Como Usar

### Usando um Card com Skeleton

```tsx
import { FunnelCard } from '@/components/dashboard/cards/FunnelCard';

export default function Page() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <FunnelCard className="h-[320px]" />
      </div>
    </div>
  );
}
```

### Criando um Novo Hook de Dados

```tsx
// hooks/dashboard/useNewData.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';

export function useNewData() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: async () => {
      const response = await fetch('/api/dashboard/new');
      return response.json();
    },
  });
}
```

### Criando um Novo Skeleton

```tsx
// components/dashboard/skeletons/NewSkeleton.tsx
export function NewSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      <div className="h-6 w-32 bg-gray-100 rounded skeleton-shimmer" />
      {/* Mais elementos... */}
    </div>
  );
}
```

## 🔧 Configurações do React Query

O arquivo `lib/dashboard/queries.ts` contém:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutos
      gcTime: 1000 * 60 * 30,      // 30 minutos
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
```

### Invalidando Queries

```typescript
import { queryClient } from '@/lib/dashboard/queries';

// Invalidar tudo
queryClient.invalidateQueries({ queryKey: ['dashboard'] });

// Invalidar apenas funil
queryClient.invalidateQueries({ queryKey: dashboardKeys.funnel() });
```

## 🎨 Personalização

### Cores do Skeleton

Edite `styles/skeleton.css`:

```css
.skeleton-shimmer {
  background-color: #e5e7eb; /* gray-200 */
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .skeleton-shimmer {
    background-color: #374151; /* gray-700 */
  }
}
```

### Velocidade da Animação

```css
.skeleton-shimmer::after {
  animation: shimmer 1.5s infinite; /* Altere para mais rápido/lento */
}
```

## 🧪 Testando o Loading

Para simular loading e ver os skeletons, adicione delay nas APIs:

```typescript
// app/api/dashboard/funnel/route.ts
export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
  return NextResponse.json({ ... });
}
```

## 📱 Responsividade

O layout atual é **desktop-first**. Para adicionar responsividade mobile:

```tsx
// DashboardGrid.tsx modificado
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards... */}
</div>
```

## 🐛 Troubleshooting

### Skeleton não aparece

Verifique se o CSS foi importado:
```tsx
import '@/styles/skeleton.css';
```

### Dados não carregam

Verifique se o ReactQueryProvider envolve a aplicação.

### TypeScript errors

Certifique-se de que todos os tipos em `types/dashboard.ts` estão exportados corretamente.

## 📚 Documentação Adicional

- [TDD Completo](./TDD-Dashboard-Analytics.md) - Documento técnico detalhado
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
