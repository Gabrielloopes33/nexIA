# 📚 Documentação do Projeto - NexIA Chat Dashboard

Bem-vindo à documentação técnica completa do projeto NexIA Chat Dashboard.

---

## 📂 Estrutura de Documentos

### 🎯 Para Início Rápido

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** | Guia rápido com snippets prontos | Durante desenvolvimento, para copiar código padrão |
| **[GUIA-VISUAL.md](GUIA-VISUAL.md)** | Exemplos visuais ✅ vs ❌ de componentes | Para validar se seu código está correto |
| **[CLAUDE.md](CLAUDE.md)** | Regras e configurações do Claude Code | Referência sobre o workflow AIOS |

### 📖 Documentação Completa

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md)** | Especificações técnicas completas do projeto | Antes de criar novos componentes/páginas |
| **[ANALISE-PROJETO.md](ANALISE-PROJETO.md)** | Análise detalhada da arquitetura e código | Para entender o projeto como um todo |

### 🎨 Skills & Comandos

| Pasta | Descrição |
|-------|-----------|
| **[skills/](skills/)** | 30+ Skills especializadas do AIOS Framework |
| **[commands/](commands/)** | Comandos customizados (se houver) |
| **[rules/](rules/)** | Regras específicas do projeto |

---

## 🚀 Começando um Novo Desenvolvimento

### 1️⃣ Primeira Vez no Projeto?

Leia nesta ordem:

1. **[ANALISE-PROJETO.md](ANALISE-PROJETO.md)** - Entenda a stack e arquitetura
2. **[ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md)** - Aprenda os padrões de design
3. **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Salve nos favoritos para consultas rápidas

### 2️⃣ Criando Nova Página/Componente?

1. ✅ Abra **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** em uma aba
2. ✅ Consulte **"Checklist Rápido"** no final do documento
3. ✅ Copie o template adequado (Card, List, etc)
4. ✅ Adapte para seu caso de uso
5. ✅ Valide com **[GUIA-VISUAL.md](GUIA-VISUAL.md)** (compare ✅ vs ❌)
6. ✅ Garanta consistência visual

### 3️⃣ Dúvida sobre Cores/Espaçamento?

📖 **[ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md)** → Seção **"Sistema de Cores"** ou **"Layout & Grid System"**

### 4️⃣ Precisa de um Padrão Específico?

🔍 **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** → Busque por: Badge, Button, Card, Input, etc.

---

## 🎨 Design System

### Cores Principais

```css
Primária:    #2563EB (Azul)
Sidebar:     #7C3AED (Roxo)
Success:     #16A34A (Verde)
Warning:     #D97706 (Laranja)
Error:       #DC2626 (Vermelho)
```

### Componentes Base

- **Cards**: `rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
- **Buttons**: Componente shadcn/ui com variantes (default, outline, ghost, destructive)
- **Badges**: Pills com cores semânticas
- **Avatars**: Círculos com iniciais e cores variadas

### Tipografia

- **Page Title**: 32px Bold
- **Section Title**: 16px Semibold
- **Body**: 14px Regular/Semibold
- **Caption**: 12px Regular

---

## 🧩 Componentes Reutilizáveis

### Já Implementados

| Componente | Localização | Uso |
|------------|-------------|-----|
| `Sidebar` | `components/sidebar.tsx` | Navegação principal (roxo) |
| `DashboardHeader` | `components/dashboard-header.tsx` | Header com busca e notificações |
| `KpiCards` | `components/kpi-cards.tsx` | Grid 2x2 de métricas |
| `LeadTrendsChart` | `components/lead-trends-chart.tsx` | Gráfico de área (Recharts) |
| `RecentLeads` | `components/recent-leads.tsx` | Lista de leads com hover |
| `RightPanel` | `components/right-panel.tsx` | Stats e ações rápidas |
| **+40 componentes UI** | `components/ui/` | shadcn/ui (Button, Card, Input, etc) |

### Como Usar

```tsx
import { Sidebar } from "@/components/sidebar"
import { KpiCards } from "@/components/kpi-cards"

export default function MyPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <KpiCards />
      </main>
    </div>
  )
}
```

---

## 📊 Estrutura de Dados

### Types Principais

```typescript
type Status = "valid" | "risky" | "invalid"
type AppointmentStatus = "pendente" | "confirmado" | "cancelado" | "concluido"
type Channel = "Iframe" | "WhatsApp" | "Instagram"

interface Lead {
  id: number
  name: string
  role: string
  email: string
  status: Status
  avatar: string
  avatarBg: string
  avatarColor: string
}

interface Appointment {
  id: number
  nome: string
  data: string
  horario: string
  status: AppointmentStatus
  tipo: "ligacao" | "reuniao" | "teste" | "demo"
}
```

**📝 Nota:** Atualmente todos os dados são mockados. Backend será implementado na Fase 1.

---

## 🎓 AIOS Skills Disponíveis

Este projeto tem acesso a **30+ Skills especializadas** do AIOS Framework:

### Desenvolvimento
- `coding-guidelines` - Padrões de código limpo
- `best-practices` - Melhores práticas de desenvolvimento
- `skill-creator` - Criar novas skills

### Web Quality
- `web-quality-audit` - Auditoria completa de qualidade
- `accessibility` - WCAG 2.1 compliance
- `seo` - Otimização para motores de busca
- `core-web-vitals` - Performance (LCP, CLS, INP)
- `perf-web-optimization` - Otimização de bundle e recursos

### Security
- `security-best-practices` - Revisão de segurança
- `security-ownership-map` - Análise de ownership

### Deployment
- `cloudflare-deploy` - Deploy na Cloudflare
- `netlify-deploy` - Deploy no Netlify
- `render-deploy` - Deploy no Render

### n8n Automation (caso integre)
- `n8n-workflow-patterns` - Padrões de workflow
- `n8n-code-javascript` - Code nodes em JS
- `n8n-validation-expert` - Validação de workflows

**Ver todas:** [skills/](skills/)

---

## 🏗️ Arquitetura do Projeto

```
📁 Projeto/
├── 📁 app/                      # App Router (Next.js)
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Dashboard (/)
│   ├── agendamentos/page.tsx    # /agendamentos
│   ├── conversas/page.tsx       # /conversas
│   └── pipeline/page.tsx        # /pipeline
│
├── 📁 components/               # Componentes React
│   ├── sidebar.tsx              # Navegação
│   ├── dashboard-header.tsx     # Header
│   ├── kpi-cards.tsx            # Métricas
│   └── ui/                      # shadcn/ui (40+ componentes)
│
├── 📁 .claude/                  # AIOS & Documentação
│   ├── ESPECIFICACOES-TECNICAS.md
│   ├── QUICK-REFERENCE.md
│   ├── ANALISE-PROJETO.md
│   ├── CLAUDE.md
│   └── skills/                  # 30+ Skills especializadas
│
└── 📁 lib/                      # Utilities
    └── utils.ts                 # cn(), helpers
```

---

## ✅ Checklist de Qualidade

Antes de fazer commit/PR:

### Visual
- [ ] Segue paleta de cores do design system
- [ ] Ícones com tamanho e strokeWidth corretos
- [ ] Espaçamento consistente (gap-6, p-6, etc)
- [ ] Cards com bordas, sombras e arredondamento padrão
- [ ] Responsivo (mobile, tablet, desktop)

### Código
- [ ] TypeScript sem erros
- [ ] Componentes bem nomeados (PascalCase)
- [ ] Props tipadas
- [ ] Imports organizados
- [ ] Sem console.logs

### UX
- [ ] Estados de hover definidos
- [ ] Estados de focus em inputs
- [ ] Transições suaves
- [ ] Feedback visual em ações
- [ ] Mensagens de erro claras

---

## 🔗 Links Úteis

### Documentação Externa
- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **Lucide Icons:** https://lucide.dev/
- **Recharts:** https://recharts.org/

### Interna
- **Análise completa:** [ANALISE-PROJETO.md](ANALISE-PROJETO.md)
- **Specs técnicas:** [ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md)
- **Quick ref:** [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- **Guia visual:** [GUIA-VISUAL.md](GUIA-VISUAL.md)

---

## 🚧 Roadmap

### ✅ Concluído
- [x] Setup inicial do projeto
- [x] Design system implementado
- [x] Componentes base criados
- [x] 4 páginas principais (Dashboard, Conversas, Agendamentos, Pipeline)
- [x] Documentação técnica completa

### 🔄 Em Desenvolvimento
- [ ] Backend API com Prisma
- [ ] Autenticação NextAuth.js
- [ ] State management (Zustand)
- [ ] Testes unitários

### 📋 Backlog
- [ ] Real-time features (WebSockets)
- [ ] PWA support
- [ ] Dark mode
- [ ] Exports (PDF, CSV)
- [ ] Integrações (CRM, Email, etc)

---

## 📞 Suporte

**Dúvidas sobre:**
- **Design/UI:** Consulte [ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md)
- **Código rápido:** Consulte [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- **Arquitetura:** Consulte [ANALISE-PROJETO.md](ANALISE-PROJETO.md)
- **AIOS Skills:** Navegue em [skills/](skills/)

---

## 📝 Convenções

### Commits
```
feat: adiciona filtro de leads por status
fix: corrige overflow no sidebar mobile
docs: atualiza QUICK-REFERENCE com novo padrão
refactor: move utils para lib/
style: ajusta espaçamento nos cards
```

### Branches
```
feature/nome-da-feature
bugfix/nome-do-bug
docs/nome-da-doc
refactor/nome-do-refactor
```

---

## 🎉 Começar Agora

**Para novo desenvolvedor:**

1. 📖 Leia [ANALISE-PROJETO.md](ANALISE-PROJETO.md) (10 min)
2. 🎨 Estude [ESPECIFICACOES-TECNICAS.md](ESPECIFICACOES-TECNICAS.md) (20 min)
3. 🚀 Salve [QUICK-REFERENCE.md](QUICK-REFERENCE.md) nos favoritos
4. 💻 Clone o projeto e rode `pnpm install && pnpm dev`
5. 🌐 Abra http://localhost:3000

**Pronto para desenvolver!** 🚀

---

*Documentação NexIA Chat Dashboard v1.0.0*  
*Última atualização: 26 de Fevereiro de 2026*  
*Gerado com AIOS Framework*
