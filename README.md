# NexIA Chat

<p align="center">
  <img src="public/nexia-logo.png" alt="NexIA Logo" width="200"/>
</p>

<p align="center">
  <strong>CRM Completo Multi-Tenant com Inteligência Artificial</strong>
</p>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-stack-tecnológico">Stack</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-configuração">Configuração</a> •
  <a href="#-deploy">Deploy</a> •
  <a href="#-documentação">Docs</a>
</p>

---

## 📋 Sobre

O **NexIA Chat** é um CRM (Customer Relationship Management) brasileiro multi-tenant, projetado para empresas que precisam gerenciar relacionamentos com clientes através de múltiplos canais de comunicação.

### 🎯 Público-alvo
- Agências de marketing digital
- Empresas de vendas e prospecção
- Suporte técnico e atendimento ao cliente
- E-commerces que precisam de gestão de leads

---

## ✨ Funcionalidades

### 💬 Comunicação Omnichannel
- **WhatsApp Business API (Oficial)** - Integração direta com Meta
- **WhatsApp Não Oficial (Evolution API)** - Via QR Code
- **Instagram Direct** - Mensagens e comentários
- **Chat Widget** - Para sites

### 👥 Gestão de Contatos
- Cadastro completo de contatos
- Tags e segmentação
- Listas dinâmicas
- Campos personalizados
- Importação/Exportação

### 📊 Pipeline de Vendas
- Funil de vendas customizável
- Etapas com drag-and-drop
- Deals (oportunidades) com valor e estimativa
- Histórico de atividades

### 🤖 Inteligência Artificial
- Insights automáticos de conversas
- Análise de sentimento
- Sugestões de resposta
- Transcrição de áudio

### 📅 Agendamentos
- Tarefas, reuniões, ligações e prazos
- Fila de atendimento
- Notificações e lembretes

### 💳 Cobranças e Assinaturas
- Integração com Stripe
- Gestão de planos e assinaturas
- Faturas e reembolsos
- Cupons de desconto

### 📈 Dashboard e Analytics
- Métricas em tempo real
- Gráficos de desempenho
- Análise de funil
- Relatórios exportáveis

---

## 🛠 Stack Tecnológico

### Core
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [Next.js](https://nextjs.org/) | 15.5.13 | Framework React com App Router |
| [React](https://react.dev/) | 18.3.1 | Biblioteca UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.7.3 | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 4.2.1 | Estilização utilitária |

### Banco de Dados
| Tecnologia | Uso |
|------------|-----|
| [PostgreSQL](https://www.postgresql.org/) | 15+ - Banco principal |
| [Prisma ORM](https://www.prisma.io/) | 5.22.0 - ORM e migrations |
| [Supabase](https://supabase.com/) | Opção cloud para PostgreSQL |

### UI/UX
| Biblioteca | Propósito |
|------------|-----------|
| [shadcn/ui](https://ui.shadcn.com/) | Componentes base (Radix UI) |
| [Lucide React](https://lucide.dev/) | Ícones |
| [Recharts](https://recharts.org/) | Gráficos e dashboards |
| [@dnd-kit](https://dndkit.com/) | Drag-and-drop (pipeline) |
| [date-fns](https://date-fns.org/) | Manipulação de datas |

### Estado e Dados
| Biblioteca | Uso |
|------------|-----|
| [TanStack Query](https://tanstack.com/query) | 5.90+ - Data fetching |
| [Zod](https://zod.dev/) | Validação de schemas |
| [React Hook Form](https://react-hook-form.com/) | Formulários |

### Integrações
| Serviço | Uso |
|---------|-----|
| [Meta Business API](https://developers.facebook.com/docs/business-apis) | WhatsApp e Instagram |
| [Stripe](https://stripe.com/) | Pagamentos e assinaturas |
| [Evolution API](https://doc.evolution-api.com/) | WhatsApp não oficial |
| [OpenAI](https://openai.com/) | Insights de IA (opcional) |

---

## 📦 Instalação

### Pré-requisitos
- Node.js 20+
- PostgreSQL 15+
- pnpm (recomendado) ou npm

### 1. Clone o repositório

```bash
git clone https://github.com/nexialab/nexIA.git
cd nexIA
```

### 2. Instale as dependências

```bash
pnpm install
# ou
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite o `.env.local` com suas configurações:

```env
# ============================================
# OBRIGATÓRIAS
# ============================================

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/nexia_chat

# Auth - Chave secreta para sessões (mínimo 32 caracteres)
AUTH_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres

# ============================================
# INTEGRAÇÕES (opcionais)
# ============================================

# Meta/WhatsApp Oficial
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret

# Evolution API (WhatsApp Não Oficial)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OpenAI (opcional)
OPENAI_API_KEY=sk-...
```

### 4. Execute as migrações do banco

```bash
npx prisma migrate dev
# ou
pnpm db:migrate
```

### 5. Gere o cliente Prisma

```bash
npx prisma generate
```

### 6. Crie um usuário admin

```bash
pnpm create-admin
# ou
node scripts/create-admin.js
```

### 7. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse: http://localhost:3000

---

## ⚙️ Configuração

### WhatsApp Oficial (Meta Business API)

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um app do tipo "Business"
3. Adicione o produto "WhatsApp"
4. Configure o webhook apontando para `https://seudominio.com/api/whatsapp/webhooks`
5. Copie as credenciais para as variáveis de ambiente

### WhatsApp Não Oficial (Evolution API)

1. Tenha acesso a uma instância da [Evolution API](https://evolution-api.com/)
2. Configure as variáveis `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
3. Configure o webhook para `https://seudominio.com/api/evolution/webhook`
4. No painel do NexIA, vá em "Integrações > WhatsApp Não Oficial" e crie uma instância

### Stripe (Assinaturas)

1. Crie uma conta em [Stripe](https://stripe.com/)
2. Copie as chaves de teste/produção
3. Configure o webhook apontando para `https://seudominio.com/api/stripe/webhook`
4. Configure os eventos: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 🚀 Deploy

### Opção 1: Netlify (Recomendado)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/nexialab/nexIA)

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente no painel
3. Deploy automático a cada push

**Configurações importantes no Netlify:**
- Build command: `pnpm install && npx prisma generate && pnpm run build`
- Publish directory: `.next`
- Node version: 20

### Opção 2: EasyPanel

Veja o guia completo em [`EASYPANEL.md`](./EASYPANEL.md)

```bash
# Com Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Opção 3: VPS com Docker

```bash
# Build da imagem
docker build -t nexia-app:latest .

# Run
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e AUTH_SECRET=... \
  --name nexia-app \
  nexia-app:latest
```

---

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes de integração
pnpm test:integration

# Testes E2E com Playwright
pnpm test:e2e

# Cobertura
pnpm test:coverage
```

---

## 📚 Documentação

- [`AGENTS.md`](./AGENTS.md) - Informações para desenvolvedores/agentes de IA
- [`DEPLOY.md`](./DEPLOY.md) - Guia completo de deploy
- [`EASYPANEL.md`](./EASYPANEL.md) - Deploy no EasyPanel
- [`SUPABASE-EASYPANEL.md`](./SUPABASE-EASYPANEL.md) - Configuração com Supabase
- [`docs/`](./docs/) - Documentação técnica detalhada

---

## 🏗️ Estrutura do Projeto

```
app/                          # Next.js App Router
├── (dashboard)/              # Grupo de rotas com layout
├── api/                      # API Routes
├── contatos/                 # Páginas de contatos
├── conversas/                # Páginas de conversas
├── dashboard/                # Dashboard
├── pipeline/                 # Pipeline de vendas
├── integracoes/              # Integrações
└── ...

components/
├── ui/                       # Componentes base (shadcn)
├── chat/                     # Componentes de chat
├── contacts/                 # Componentes de contatos
├── dashboard/                # Dashboard
├── pipeline/                 # Pipeline
└── evolution/                # WhatsApp Evolution

lib/
├── auth/                     # Autenticação
├── db/                       # Database/Prisma
├── services/                 # Serviços externos
├── whatsapp/                 # Integração WhatsApp
├── instagram/                # Integração Instagram
└── types/                    # Types TypeScript

prisma/
└── schema.prisma             # Schema do banco

__tests__/                    # Testes
├── unit/
├── integration/
└── e2e/
```

---

## 🔐 Segurança

- Autenticação JWT com cookies httpOnly
- Senhas hasheadas com bcrypt
- Proteção CSRF via Next.js
- SQL injection protegido pelo Prisma
- Headers de segurança configurados
- Validação de schemas com Zod

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário da NexIA Labs. Todos os direitos reservados.

---

## 💬 Suporte

Em caso de problemas:

1. Verifique os logs: `docker logs nexia-app`
2. Health check: `curl https://seudominio.com/api/health`
3. Abra uma issue no GitHub

---

<p align="center">
  Desenvolvido com ❤️ pela <strong>NexIA Labs</strong>
</p>
