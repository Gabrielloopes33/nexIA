# AGENTS.md - NexIA Chat

> Este arquivo contém informações essenciais sobre o projeto NexIA Chat para agentes de IA.
> Idioma principal: Português (pt-BR)

---

## Visão Geral do Projeto

**NexIA Chat** é um CRM (Customer Relationship Management) multi-tenant brasileiro com foco em:
- **Gestão de Contatos**: Cadastro, segmentação, tags e listas dinâmicas
- **Comunicação Omnichannel**: WhatsApp Business API e Instagram (Meta)
- **Pipeline de Vendas**: Funil de vendas com etapas customizáveis
- **Conversas**: Chat unificado com histórico de mensagens
- **Dashboard**: Métricas de vendas e performance em tempo real
- **Agendamentos**: Tarefas, reuniões, ligações e prazos
- **Assinaturas**: Gestão de planos e cobranças via Stripe

---

## Stack Tecnológico

### Core
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Next.js | 15.2.4 | Framework React com App Router |
| React | 18.3.1 | Biblioteca UI |
| TypeScript | 5.7.3 | Linguagem tipada |
| Tailwind CSS | 4.2.1 | Estilização utilitária |

### Banco de Dados
| Tecnologia | Uso |
|------------|-----|
| PostgreSQL | Banco principal (15+) |
| Prisma ORM | 5.22.0 - ORM e migrations |
| Supabase | Opção cloud para PostgreSQL |

### UI/UX
| Biblioteca | Propósito |
|------------|-----------|
| shadcn/ui | Componentes base (Radix UI) |
| Lucide React | Ícones |
| Recharts | Gráficos e dashboards |
| @dnd-kit | Drag-and-drop (pipeline) |
| date-fns | Manipulação de datas |

### Estado e Dados
| Biblioteca | Uso |
|------------|-----|
| TanStack Query | 5.90+ - Data fetching e cache |
| Zod | Validação de schemas |
| React Hook Form | Formulários |

### Integrações
| Serviço | Uso |
|---------|-----|
| Meta Business API | WhatsApp Business e Instagram |
| Stripe | Pagamentos e assinaturas |
| OpenAI | Insights de IA (opcional) |

---

## Estrutura de Diretórios

```
app/                          # Next.js App Router
├── (dashboard)/              # Grupo de rotas com layout do dashboard
├── api/                      # API Routes (backend)
│   ├── auth/                 # Autenticação (login, logout, etc)
│   ├── contacts/             # CRUD de contatos
│   ├── conversations/        # Conversas e mensagens
│   ├── dashboard/            # Endpoints de métricas
│   ├── pipeline/             # Funil de vendas
│   ├── whatsapp/             # Integração WhatsApp
│   ├── instagram/            # Integração Instagram
│   └── ...
├── contatos/                 # Páginas de contatos
├── conversas/                # Páginas de conversas
├── dashboard/                # Página principal
├── pipeline/                 # Pipeline de vendas
├── configuracoes/            # Configurações
└── ...

components/
├── ui/                       # Componentes base (shadcn)
├── chat/                     # Componentes de chat
├── contacts/                 # Componentes de contatos
├── dashboard/                # Componentes do dashboard
├── pipeline/                 # Componentes do pipeline
├── whatsapp/                 # Componentes WhatsApp
└── providers/                # React Context Providers

lib/
├── auth/                     # Utilitários de autenticação
├── db/                       # Queries e configuração do Prisma
├── whatsapp/                 # Integração WhatsApp
├── instagram/                # Integração Instagram
├── calculations/             # Cálculos de métricas
├── types/                    # Types TypeScript
└── utils.ts                  # Utilitários gerais

hooks/                        # React Custom Hooks
├── use-contacts.ts
├── use-conversations.ts
├── use-dashboard.ts
├── use-whatsapp.ts
└── ...

prisma/
└── schema.prisma             # Schema do banco de dados

types/                        # Types globais
__tests__/                    # Testes
├── unit/                     # Testes unitários
├── integration/              # Testes de integração
├── e2e/                      # Testes E2E (Playwright)
└── mocks/                    # Mocks para testes

docs/                         # Documentação do projeto
scripts/                      # Scripts utilitários
```

---

## Comandos de Build e Desenvolvimento

```bash
# Instalação de dependências
pnpm install

# Desenvolvimento
pnpm dev                    # Inicia servidor de desenvolvimento (porta 3000)

# Build
pnpm build                  # Build de produção (usa scripts/build.js)

# Type checking
pnpm typecheck              # Verificação de tipos TypeScript

# Testes
pnpm test                   # Executa testes unitários em modo watch
pnpm test:run               # Executa testes unitários uma vez
pnpm test:unit              # Testes unitários apenas
pnpm test:integration       # Testes de integração
pnpm test:coverage          # Testes com relatório de cobertura
pnpm test:e2e               # Testes E2E com Playwright
pnpm test:e2e:ui            # Testes E2E com interface

# Banco de Dados
pnpm db:migrate             # Executa migrações Prisma
pnpm db:push                # Push do schema (desenvolvimento)
pnpm db:generate            # Gera cliente Prisma

# Docker
pnpm docker:build           # Build da imagem Docker
pnpm docker:up              # Inicia containers
pnpm docker:down            # Para containers

# Outros
pnpm lint                   # ESLint
pnpm create-admin           # Cria usuário admin
```

---

## Autenticação

O sistema usa **autenticação baseada em cookies JWT** implementada via middleware Next.js:

### Fluxo de Autenticação
1. Usuário faz login em `/api/auth/login` com email/senha
2. Token JWT é gerado e armazenado em cookie `nexia_session`
3. Middleware (`middleware.ts`) verifica o cookie em cada requisição
4. Rotas públicas são definidas em `PUBLIC_PATHS`

### Estrutura do Token
```typescript
interface SessionPayload {
  userId: string
  email: string
  name: string | null
  organizationId: string | null
  expiresAt: number
}
```

### Utilitários de Auth
- `lib/auth/server.ts` - Funções para API routes
- `lib/auth/session.ts` - Gestão de sessão
- `lib/auth/password.ts` - Hash de senhas (bcrypt)

---

## Arquitetura de Multi-tenancy

O sistema é **multi-tenant por organização**:

- Cada usuário pode pertencer a múltiplas organizações (`OrganizationMember`)
- Todas as entidades (contatos, deals, etc.) têm `organizationId`
- Middleware e API routes filtram dados pela organização atual
- Usuário pode trocar de organização via `/api/user/switch-organization`

---

## Padrões de Código

### Componentes React
- Usar **Server Components** por padrão
- **Client Components** apenas quando necessário (`"use client"`)
- Componentes UI baseados em shadcn/ui com Tailwind
- Props interface sempre exportada

### Nomenclatura
- Components: PascalCase (`ContactCard.tsx`)
- Hooks: camelCase com prefixo `use` (`useContacts.ts`)
- Utilitários: camelCase (`formatPhone.ts`)
- API Routes: lowercase (`route.ts`)
- Variáveis/Funções: camelCase em português

### Importações
Usar alias `@/` para imports absolutos:
```typescript
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { useContacts } from "@/hooks/use-contacts"
```

### Estilização
- Tailwind CSS para todos os estilos
- Variáveis CSS para cores no tema (ver `app/globals.css`)
- Classes utilitárias seguindo convenção do shadcn/ui

---

## Testes

### Configuração
- **Unit/Integration**: Vitest + jsdom + React Testing Library
- **E2E**: Playwright com múltiplos viewports (desktop, tablet, mobile)
- **Cobertura**: Thresholds definidos em 90%

### Executando Testes
```bash
# Unit/Integration
pnpm test:run

# Com cobertura
pnpm test:coverage

# E2E
pnpm test:e2e
```

### Estrutura de Testes
```
__tests__/
├── unit/                     # Testes unitários
├── integration/              # Testes de integração API
├── e2e/                      # Testes E2E
└── mocks/                    # Dados mockados
```

---

## Variáveis de Ambiente

### Obrigatórias
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTH_SECRET=chave_secreta_32_caracteres_minimo
```

### Opcionais (Funcionalidades)
```env
# Meta/WhatsApp
META_APP_ID=xxx
META_APP_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# OpenAI
OPENAI_API_KEY=sk-...

# Webhook de Formulário
FORM_WEBHOOK_SECRET=whsec_...
```

Arquivos de exemplo:
- `.env.local.example` - Configuração local
- `.env.production.example` - Configuração de produção

---

## Deploy

### Opções Recomendadas

1. **EasyPanel + GitHub** (Recomendado)
   - Auto-deploy a cada push na `main`
   - Ver `EASYPANEL.md` para detalhes

2. **Docker Manual**
   ```bash
   docker build -t nexia-app:latest .
   docker run -p 3000:3000 nexia-app:latest
   ```

3. **VPS com Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Health Check
Endpoint `/api/health` retorna status do sistema:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Integrações Externas

### WhatsApp Business API (Meta)
- Autenticação via Embedded Signup
- Webhooks para receber mensagens
- Templates de mensagens aprovados
- API em `/app/api/whatsapp/`

### Instagram
- Integração via Meta Business API
- Webhooks para mensagens diretas
- API em `/app/api/instagram/`

### Stripe
- Assinaturas e cobranças
- Webhooks para eventos de pagamento
- Endpoint: `/api/stripe/webhook`

---

## Banco de Dados

### Principais Entidades
- **Organization**: Tenant principal
- **User**: Usuários do sistema
- **Contact**: Contatos dos clientes
- **Deal**: Oportunidades no pipeline
- **PipelineStage**: Etapas do funil
- **Conversation**: Conversas
- **Message**: Mensagens
- **Tag**: Tags para categorização
- **List**: Listas de contatos
- **Schedule**: Agendamentos

### Migrations
Usar Prisma Migrate:
```bash
npx prisma migrate dev --name nome_da_migration
```

---

## Segurança

### Práticas Implementadas
- Senhas hasheadas com bcrypt
- JWT para sessões com expiração
- CSRF protegido pelo Next.js
- SQL injection protegido pelo Prisma
- Headers de segurança via Next.js

### Variáveis Sensíveis
Nunca commitar:
- `.env.local`
- `.env.production`
- Chaves de API
- Secrets de autenticação

---

## Documentação Adicional

- `DEPLOY.md` - Guia completo de deploy
- `EASYPANEL.md` - Deploy no EasyPanel
- `docs/` - Documentação técnica detalhada
- `MIGRATION_PLANO_EXECUCAO.md` - Plano de migração do banco

---

## Comandos Úteis

```bash
# Gerar AUTH_SECRET
openssl rand -hex 32

# Acessar banco via Prisma Studio
npx prisma studio

# Reset do banco (CUIDADO!)
npx prisma migrate reset

# Ver logs do container Docker
docker logs -f nexia-app
```

---

## Contato e Suporte

Em caso de problemas:
1. Verifique logs: `docker logs nexia-production`
2. Health check: `curl localhost:3000/api/health`
3. Teste DB: Verifique conexão PostgreSQL
