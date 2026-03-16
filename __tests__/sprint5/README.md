# Sprint 5 - Cobranças e Assinaturas: Testes

Este diretório contém os testes para validar a funcionalidade de Cobranças e Assinaturas (Sprint 5).

## 📁 Estrutura

```
__tests__/sprint5/
├── README.md                          # Este arquivo
├── api/                               # Testes de API
│   ├── plans.test.ts                  # GET/POST /api/plans
│   ├── subscriptions.test.ts          # GET/POST /api/subscriptions
│   ├── invoices.test.ts               # GET /api/invoices
│   ├── charges.test.ts                # GET/POST /api/charges
│   └── coupons.test.ts                # GET/POST /api/coupons
└── hooks/                             # Testes de Hooks
    ├── use-plans.test.ts              # Hook usePlans
    ├── use-subscriptions.test.ts      # Hook useSubscriptions
    └── use-invoices.test.ts           # Hook useInvoices
```

## 🚀 Executando os Testes

### Executar todos os testes da Sprint 5:

```bash
npm run test:unit __tests__/sprint5
```

### Executar apenas testes de API:

```bash
npm run test:unit __tests__/sprint5/api
```

### Executar apenas testes de Hooks:

```bash
npm run test:unit __tests__/sprint5/hooks
```

### Executar teste específico:

```bash
npm run test:unit __tests__/sprint5/api/plans.test.ts
```

### Executar em modo watch:

```bash
npx vitest __tests__/sprint5 --watch
```

## 📋 Resumo dos Testes

### API Tests

#### plans.test.ts (12 testes)
- ✅ GET: Retorna lista de planos ativos
- ✅ GET: Filtra por intervalo (monthly/yearly)
- ✅ GET: Paginação correta
- ✅ GET: Tratamento de erros do banco
- ✅ GET: Retorna array vazio quando não há planos
- ✅ POST: Cria plano com sucesso
- ✅ POST: Valida campos obrigatórios
- ✅ POST: Valida intervalo inválido
- ✅ POST: Valida preço negativo
- ✅ POST: Tratamento de erros do banco
- ✅ POST: Usa valores padrão para features/limits

#### subscriptions.test.ts (13 testes)
- ✅ GET: Retorna assinaturas da organização
- ✅ GET: Valida organizationId obrigatório
- ✅ GET: Filtra por status
- ✅ GET: Paginação correta
- ✅ GET: Tratamento de erros do banco
- ✅ POST: Cria assinatura com sucesso
- ✅ POST: Valida campos obrigatórios
- ✅ POST: Valida existência do plano
- ✅ POST: Valida formato de data
- ✅ POST: Valida ordem das datas
- ✅ POST: Valida status inválido
- ✅ POST: Define status padrão como active
- ✅ POST: Tratamento de erros do banco

#### invoices.test.ts (8 testes)
- ✅ GET: Retorna faturas da organização
- ✅ GET: Valida organizationId obrigatório
- ✅ GET: Filtra por status
- ✅ GET: Filtra por subscriptionId
- ✅ GET: Paginação correta
- ✅ GET: Ordenação por createdAt desc
- ✅ GET: Tratamento de erros do banco
- ✅ GET: Retorna array vazio quando não há faturas

#### charges.test.ts (16 testes)
- ✅ GET: Retorna cobranças da organização
- ✅ GET: Valida organizationId obrigatório
- ✅ GET: Filtra por status
- ✅ GET: Filtra por invoiceId
- ✅ GET: Paginação correta
- ✅ GET: Tratamento de erros do banco
- ✅ POST: Cria cobrança com sucesso
- ✅ POST: Cria cobrança vinculada a fatura
- ✅ POST: Valida campos obrigatórios
- ✅ POST: Valida valor negativo
- ✅ POST: Valida valor zero
- ✅ POST: Valida status inválido
- ✅ POST: Valida existência da fatura
- ✅ POST: Valida organização da fatura
- ✅ POST: Define paidAt quando status é paid
- ✅ POST: Tratamento de erros do banco

#### coupons.test.ts (14 testes)
- ✅ GET: Retorna cupons ativos válidos
- ✅ GET: Filtra por período de validade
- ✅ GET: Paginação correta
- ✅ GET: Tratamento de erros do banco
- ✅ GET: Retorna array vazio quando não há cupons
- ✅ POST: Valida cupom com sucesso (porcentagem)
- ✅ POST: Valida cupom com sucesso (valor fixo)
- ✅ POST: Valida código obrigatório
- ✅ POST: Retorna 404 quando cupom não existe
- ✅ POST: Retorna 404 quando cupom está inativo
- ✅ POST: Retorna 404 quando cupom ainda não é válido
- ✅ POST: Retorna 404 quando cupom expirou
- ✅ POST: Retorna 404 quando limite de uso atingido
- ✅ POST: Normaliza código para uppercase
- ✅ POST: Tratamento de erros do banco

### Hook Tests

#### use-plans.test.ts (16 testes)
- ✅ Fetch: Busca planos no mount
- ✅ Fetch: Tratamento de erro
- ✅ Fetch: Estado de loading
- ✅ Fetch: Filtro de status
- ✅ Fetch: Refetch atualiza dados
- ✅ Create: Cria plano com sucesso
- ✅ Create: Tratamento de erro
- ✅ Create: Com campos opcionais
- ✅ Update: Atualiza plano com sucesso
- ✅ Update: Tratamento de erro
- ✅ Delete: Remove plano com sucesso
- ✅ Delete: Tratamento de erro

#### use-subscriptions.test.ts (16 testes)
- ✅ Fetch: Busca assinaturas no mount
- ✅ Fetch: Não busca sem organizationId
- ✅ Fetch: Tratamento de erro
- ✅ Fetch: Filtro de status
- ✅ Fetch: Refetch atualiza dados
- ✅ Create: Cria assinatura com sucesso
- ✅ Create: Não cria sem organizationId
- ✅ Create: Tratamento de erro
- ✅ Update: Atualiza assinatura com sucesso
- ✅ Update: Tratamento de erro
- ✅ Cancel: Cancela assinatura com sucesso
- ✅ Cancel: Tratamento de erro

#### use-invoices.test.ts (15 testes)
- ✅ Fetch: Busca faturas no mount
- ✅ Fetch: Não busca sem organizationId
- ✅ Fetch: Tratamento de erro
- ✅ Fetch: Filtro de status
- ✅ Fetch: Refetch atualiza dados
- ✅ Create: Cria fatura com sucesso
- ✅ Create: Não cria sem organizationId
- ✅ Create: Tratamento de erro
- ✅ Update: Atualiza fatura com sucesso
- ✅ Update: Tratamento de erro
- ✅ MarkAsPaid: Marca como pago com data específica
- ✅ MarkAsPaid: Marca como pago com data atual
- ✅ MarkAsPaid: Tratamento de erro

**Total: 100 testes**

- API Tests: 63 testes
- Hook Tests: 37 testes

## 🔧 Configuração dos Mocks

Os testes utilizam mocks do Prisma e do `global.fetch` para simular as chamadas de API e banco de dados.

### Mock do Prisma

```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    plan: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    subscription: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    invoice: { findMany: vi.fn(), count: vi.fn() },
    charge: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    coupon: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  },
}))
```

### Mock do Organization Context

O mock do contexto de organização está configurado em `__tests__/setup.ts`:

```typescript
const mockOrgId = 'test-org-123'
vi.mock('@/lib/contexts/organization-context', () => ({
  useOrganization: () => ({ organization: { id: mockOrgId, ... } }),
  useOrganizationId: () => mockOrgId,
}))
```

## 📝 Convenções

1. **Nomenclatura**: Arquivos de teste seguem o padrão `*.test.ts`
2. **Estrutura**: Cada arquivo de teste possui describe blocks agrupando por método HTTP ou funcionalidade
3. **Mocks**: Todos os mocks são limpos no `beforeEach`
4. **Asserções**: Testes verificam status codes, mensagens de erro e estrutura de dados
5. **Edge Cases**: Testes cobrem casos de erro, validações e estados vazios

## 🐛 Debugging

Para debugar um teste específico, adicione `.only` ao describe ou it:

```typescript
describe.only('GET /api/plans', () => {
  it.only('should return list of active plans', async () => {
    // test code
  })
})
```

Execute com:

```bash
npx vitest __tests__/sprint5/api/plans.test.ts --reporter=verbose
```

## 📊 Cobertura

Para ver a cobertura de código:

```bash
npm run test:coverage -- __tests__/sprint5
```
